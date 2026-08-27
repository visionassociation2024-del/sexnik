<?php

namespace App\Http\Controllers\admincp;

use App\Http\Controllers\Controller;
use App\Models\CategoriesModel;
use App\Models\OptionModel;
use App\Models\PornStarModel;
use App\Models\VideoModel;
use App\Services\Scraper\ScraperBridgeService;
use Illuminate\Http\Request;

class ScraperController extends Controller
{
    protected $scraperService;

    public function __construct()
    {
        $this->scraperService = new ScraperBridgeService();
    }

    /**
     * Display Scraper & Auto-Importer dashboard
     */
    public function getIndex()
    {
        $categories = CategoriesModel::where('status', '=', 1)->get();
        $pornstars = PornStarModel::all();
        $config = OptionModel::get_config();

        $sourcesResponse = $this->scraperService->getSources();
        $sources = isset($sourcesResponse['sources']) ? $sourcesResponse['sources'] : [
            ['id' => 'pornhub', 'name' => 'Pornhub'],
            ['id' => 'xvideos', 'name' => 'XVideos'],
            ['id' => 'xhamster', 'name' => 'XHamster'],
            ['id' => 'spankbang', 'name' => 'SpankBang'],
            ['id' => 'missav', 'name' => 'MissAV'],
            ['id' => 'eporner', 'name' => 'Eporner']
        ];

        $health = $this->scraperService->checkHealth();

        return view('admincp.scraper.index')
            ->with('categories', $categories)
            ->with('pornstars', $pornstars)
            ->with('sources', $sources)
            ->with('health', $health)
            ->with('config', $config);
    }

    /**
     * AJAX Search for videos via AdultColony API
     */
    public function postSearch(Request $request)
    {
        $source = $request->input('source', 'pornhub');
        $query = $request->input('query', '');
        $page = (int) $request->input('page', 1);

        $result = $this->scraperService->search($source, $query, $page);

        return response()->json($result);
    }

    /**
     * AJAX Import a single video into database
     */
    public function postImportVideo(Request $request)
    {
        $videoData = $request->input('video', []);
        $categoryId = $request->input('category_id');
        $pornstarId = $request->input('pornstar_id');

        if (empty($videoData)) {
            return response()->json(['success' => false, 'message' => 'No video data provided.']);
        }

        $result = $this->scraperService->importVideo($videoData, $categoryId, $pornstarId);

        return response()->json($result);
    }

    /**
     * AJAX Scrape Model/Profile using Apify Client
     */
    public function postApifyScrape(Request $request)
    {
        $profileUrl = $request->input('profile_url', 'https://pornhub.com/model/sweetie-fox');
        $profileType = $request->input('profile_type', 'about');
        $token = $request->input('token', null);
        $maxPage = (int) $request->input('max_page', 1);

        $result = $this->scraperService->scrapeApifyProfile($profileUrl, $profileType, $token, $maxPage);

        return response()->json($result);
    }

    /**
     * AJAX Import scraped Apify profile as PornStar
     */
    public function postImportPornstar(Request $request)
    {
        $profileData = $request->input('profile', []);
        if (empty($profileData)) {
            return response()->json(['success' => false, 'message' => 'No profile data provided.']);
        }

        $result = $this->scraperService->importPornstar($profileData);

        return response()->json($result);
    }
}
