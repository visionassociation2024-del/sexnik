<?php

namespace App\Services\Scraper;

use App\Models\CategoriesModel;
use App\Models\PornStarModel;
use App\Models\VideoCatModel;
use App\Models\VideoModel;
use Illuminate\Support\Str;

class ScraperBridgeService
{
    protected $bridgeUrl;
    protected $apifyToken;

    public function __construct()
    {
        $this->bridgeUrl = env('SCRAPER_BRIDGE_URL', 'http://127.0.0.1:3001');
        $this->apifyToken = env('APIFY_API_TOKEN', '');
    }

    /**
     * Send HTTP request using cURL
     */
    protected function request($url, $method = 'GET', $data = [])
    {
        $ch = curl_init();
        
        $curlOptions = [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json'
            ]
        ];

        if (strtoupper($method) === 'POST') {
            $curlOptions[CURLOPT_POST] = true;
            $curlOptions[CURLOPT_POSTFIELDS] = json_encode($data);
        }

        curl_setopt_array($ch, $curlOptions);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            return [
                'success' => false,
                'error' => $error,
                'message' => 'Failed to connect to Scraper Bridge service at ' . $this->bridgeUrl
            ];
        }

        $decoded = json_decode($response, true);
        if ($decoded === null) {
            return [
                'success' => false,
                'error' => 'Invalid JSON response',
                'raw' => $response,
                'http_code' => $httpCode
            ];
        }

        return $decoded;
    }

    /**
     * Health check
     */
    public function checkHealth()
    {
        return $this->request($this->bridgeUrl . '/api/health');
    }

    /**
     * Get available sources
     */
    public function getSources()
    {
        return $this->request($this->bridgeUrl . '/api/sources');
    }

    /**
     * Search videos from selected source
     */
    public function search($source, $query, $page = 1)
    {
        $url = $this->bridgeUrl . '/api/search?' . http_build_query([
            'source' => $source,
            'query' => $query,
            'page' => $page
        ]);

        return $this->request($url);
    }

    /**
     * Get Video Details
     */
    public function getVideoDetails($source, $id = '', $videoUrl = '')
    {
        $url = $this->bridgeUrl . '/api/video-details?' . http_build_query([
            'source' => $source,
            'id' => $id,
            'url' => $videoUrl
        ]);

        return $this->request($url);
    }

    /**
     * Scrape profile via Apify Actor (e.g. saswave/pornhub-scraper)
     */
    public function scrapeApifyProfile($profileUrl, $profileType = 'about', $customToken = null, $maxPage = 1)
    {
        $payload = [
            'token' => $customToken ?: $this->apifyToken,
            'profile_url' => $profileUrl,
            'profile_type' => $profileType,
            'max_page' => (int) $maxPage
        ];

        return $this->request($this->bridgeUrl . '/api/apify/scrape', 'POST', $payload);
    }

    /**
     * Import a scraped video into Laravel database
     */
    public function importVideo(array $item, $categoryId = null, $pornstarId = null)
    {
        $title = isset($item['title']) ? trim($item['title']) : 'Video ' . time();
        $slug = Str::slug($title);
        $stringId = (string) rand(100000000, 999999999);

        // Check if slug or title already exists
        $existing = VideoModel::where('title_name', $title)->first();
        if ($existing) {
            return [
                'success' => false,
                'message' => 'Video already exists in database with ID: ' . $existing->ID,
                'video' => $existing
            ];
        }

        // Get category info
        $category = null;
        if ($categoryId) {
            $category = CategoriesModel::find($categoryId);
        }
        if (!$category) {
            $category = CategoriesModel::first();
        }

        $catString = $category ? ($category->ID . '_' . $category->title_name) : '1_General';
        $catId = $category ? $category->ID : 1;

        $video = new VideoModel();
        $video->string_Id = $stringId;
        $video->title_name = $title;
        $video->post_name = $slug ?: ('video-' . $stringId);
        $video->categories_Id = $catString;
        $video->cat_id = (string) $catId;
        $video->pornstar_Id = $pornstarId ?: null;
        $video->channel_Id = null;
        $video->poster = isset($item['thumbnail']) ? $item['thumbnail'] : (isset($item['poster']) ? $item['poster'] : '');
        $video->video_src = isset($item['video_url']) ? $item['video_url'] : (isset($item['url']) ? $item['url'] : '');
        $video->video_sd = isset($item['video_sd']) ? $item['video_sd'] : '';
        $video->video_url = isset($item['embed_url']) ? $item['embed_url'] : (isset($item['iframe']) ? $item['iframe'] : (isset($item['video_url']) ? $item['video_url'] : ''));
        $video->video_type = isset($item['video_type']) ? $item['video_type'] : 'embed';
        $video->duration = isset($item['duration']) ? (string) $item['duration'] : '00:00';
        $video->description = isset($item['description']) ? $item['description'] : '';
        $video->status = 1; // Active
        $video->total_view = isset($item['views']) ? (int) $item['views'] : rand(10, 500);
        $video->rating = isset($item['rating']) ? (int) $item['rating'] : rand(70, 99);
        $video->tag = isset($item['tags']) ? (is_array($item['tags']) ? implode(',', $item['tags']) : $item['tags']) : 'niksex,tube';
        $video->buy_this = 0;
        $video->is_subscription = 0;
        $video->form_name = '';
        $video->allowedTypes = '';
        $video->subscriptionTypeId = '';
        $video->created_at = date('Y-m-d H:i:s');
        $video->updated_at = date('Y-m-d H:i:s');

        $saved = $video->save();

        if ($saved) {
            // Add video category mapping
            $videoCat = new VideoCatModel();
            $videoCat->video_id = $stringId;
            $videoCat->cat_id = $catId;
            $videoCat->save();

            return [
                'success' => true,
                'message' => 'Video imported successfully!',
                'video_id' => $video->ID,
                'string_id' => $stringId,
                'title' => $title
            ];
        }

        return [
            'success' => false,
            'message' => 'Failed to save video to database.'
        ];
    }

    /**
     * Import Model / Pornstar from Apify result into database
     */
    public function importPornstar(array $data)
    {
        $name = isset($data['name']) ? trim($data['name']) : (isset($data['model_name']) ? trim($data['model_name']) : '');
        if (empty($name)) {
            return ['success' => false, 'message' => 'Performer name is required.'];
        }

        $slug = Str::slug($name);
        $existing = PornStarModel::where('title_name', $name)->first();

        if ($existing) {
            return [
                'success' => false,
                'message' => 'Pornstar already exists with ID: ' . $existing->ID,
                'pornstar' => $existing
            ];
        }

        $pornstar = new PornStarModel();
        $pornstar->title_name = $name;
        $pornstar->post_name = $slug;
        $pornstar->poster = isset($data['avatar']) ? $data['avatar'] : (isset($data['image']) ? $data['image'] : '');
        $pornstar->description = isset($data['bio']) ? $data['bio'] : (isset($data['about']) ? $data['about'] : '');
        $pornstar->gender = isset($data['gender']) ? $data['gender'] : 'Female';
        $pornstar->status = 1;
        $pornstar->total_view = rand(100, 1000);
        $pornstar->tag = $name . ',niksex';
        $pornstar->save();

        return [
            'success' => true,
            'message' => 'Performer profile imported successfully!',
            'pornstar_id' => $pornstar->ID,
            'name' => $name
        ];
    }
}
