@extends('admincp.master')
@section('title', 'Auto Video Scraper & Importer (AdultColony & Apify)')
@section('subtitle', 'Scraper Tools')

@section('content')
<style>
    .scraper-card {
        background: #fff;
        border: 1px solid #e1e8ed;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 25px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .scraper-header {
        border-bottom: 2px solid #f0f3f6;
        padding-bottom: 12px;
        margin-bottom: 20px;
    }
    .scraper-header h3 {
        margin: 0;
        color: #2c3e50;
        font-size: 20px;
        font-weight: 600;
    }
    .video-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 20px;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    .video-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .video-thumb-container {
        position: relative;
        width: 100%;
        height: 140px;
        background: #000;
        overflow: hidden;
    }
    .video-thumb-container img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .video-duration {
        position: absolute;
        bottom: 6px;
        right: 6px;
        background: rgba(0,0,0,0.8);
        color: #fff;
        font-size: 11px;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 3px;
    }
    .video-body {
        padding: 12px;
    }
    .video-title {
        font-size: 13px;
        font-weight: 600;
        color: #333;
        height: 38px;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        margin-bottom: 10px;
    }
    .status-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
    }
    .badge-online {
        background: #d4edda;
        color: #155724;
    }
    .badge-offline {
        background: #f8d7da;
        color: #721c24;
    }
    .nav-tabs-custom > li.active > a {
        border-top: 3px solid #3498db;
        font-weight: bold;
    }
</style>

<div class="row" style="margin-top: 15px;">
    <div class="col-md-12">

        <!-- Status Banner -->
        <div class="scraper-card" style="padding: 12px 20px;">
            <div class="row">
                <div class="col-md-8">
                    <strong>niksex Scraper Engine:</strong>
                    @if(isset($health['status']) && $health['status'] === 'ok')
                        <span class="status-badge badge-online"><i class="fa fa-check-circle"></i> Service Connected (Port 3001)</span>
                    @else
                        <span class="status-badge badge-offline"><i class="fa fa-exclamation-triangle"></i> Companion Service Offline</span>
                        <small style="color: #777; margin-left: 10px;">Run: <code>cd services/scraper-api && npm start</code></small>
                    @endif
                </div>
                <div class="col-md-4 text-right">
                    <span class="text-muted"><i class="fa fa-shield"></i> Site: <strong>niksex</strong></span>
                </div>
            </div>
        </div>

        <!-- Navigation Tabs -->
        <ul class="nav nav-tabs nav-tabs-custom" role="tablist">
            <li role="presentation" class="active">
                <a href="#adultcolony-tab" aria-controls="adultcolony-tab" role="tab" data-toggle="tab">
                    <i class="fa fa-cloud-download"></i> AdultColony Multi-Tube Scraper
                </a>
            </li>
            <li role="presentation">
                <a href="#apify-tab" aria-controls="apify-tab" role="tab" data-toggle="tab">
                    <i class="fa fa-user-secret"></i> Apify Model & Actor Scraper
                </a>
            </li>
            <li role="presentation">
                <a href="#help-tab" aria-controls="help-tab" role="tab" data-toggle="tab">
                    <i class="fa fa-question-circle"></i> Service Documentation & Guide
                </a>
            </li>
        </ul>

        <div class="tab-content" style="margin-top: 20px;">

            <!-- ================= TAB 1: AdultColony Scraper ================= -->
            <div role="tabpanel" class="tab-pane active" id="adultcolony-tab">
                <div class="scraper-card">
                    <div class="scraper-header">
                        <h3><i class="fa fa-search"></i> Search & Import Videos</h3>
                        <p class="text-muted" style="margin-top: 5px;">Fetch videos from Pornhub, XVideos, XHamster, SpankBang, MissAV and import directly into niksex database.</p>
                    </div>

                    <form id="searchForm" class="form-inline" onsubmit="performSearch(event)">
                        <div class="form-group" style="margin-right: 10px;">
                            <label for="scraperSource" style="margin-right: 5px;">Platform:</label>
                            <select id="scraperSource" class="form-control" style="min-width: 140px;">
                                @if(isset($sources) && is_array($sources))
                                    @foreach($sources as $src)
                                        <option value="{{ $src['id'] }}">{{ $src['name'] }}</option>
                                    @endforeach
                                @else
                                    <option value="pornhub">Pornhub</option>
                                    <option value="xvideos">XVideos</option>
                                    <option value="xhamster">XHamster</option>
                                    <option value="spankbang">SpankBang</option>
                                @endif
                            </select>
                        </div>

                        <div class="form-group" style="margin-right: 10px;">
                            <label for="searchQuery" style="margin-right: 5px;">Keyword:</label>
                            <input type="text" id="searchQuery" class="form-control" style="width: 250px;" placeholder="e.g. 4k, sweetie fox, vr, hd..." required>
                        </div>

                        <div class="form-group" style="margin-right: 10px;">
                            <label for="targetCategory" style="margin-right: 5px;">Assign Category:</label>
                            <select id="targetCategory" class="form-control">
                                @foreach($categories as $cat)
                                    <option value="{{ $cat->ID }}">{{ $cat->title_name }}</option>
                                @endforeach
                            </select>
                        </div>

                        <button type="submit" id="btnSearch" class="btn btn-primary">
                            <i class="fa fa-search"></i> Search Videos
                        </button>
                    </form>

                    <!-- Alert message container -->
                    <div id="searchAlert" style="margin-top: 15px; display: none;"></div>

                    <!-- Search Results Grid -->
                    <div id="resultsContainer" style="margin-top: 25px;">
                        <div id="loadingIndicator" style="display: none; text-align: center; padding: 40px;">
                            <i class="fa fa-spinner fa-spin fa-3x" style="color: #3498db;"></i>
                            <p style="margin-top: 10px; font-weight: bold; color: #555;">Fetching live data from API...</p>
                        </div>

                        <div id="resultsGrid" class="row"></div>
                    </div>
                </div>
            </div>

            <!-- ================= TAB 2: Apify Profile Scraper ================= -->
            <div role="tabpanel" class="tab-pane" id="apify-tab">
                <div class="scraper-card">
                    <div class="scraper-header">
                        <h3><i class="fa fa-user"></i> Apify Model & Performer Scraper</h3>
                        <p class="text-muted" style="margin-top: 5px;">Extract performer profile information, bio, avatars, and model metadata using Apify Actor <code>saswave/pornhub-scraper</code>.</p>
                    </div>

                    <form id="apifyForm" onsubmit="runApifyScrape(event)">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>Model Profile URL:</label>
                                    <input type="url" id="apifyProfileUrl" class="form-control" value="https://pornhub.com/model/sweetie-fox" placeholder="https://pornhub.com/model/..." required>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label>Profile Type:</label>
                                    <select id="apifyProfileType" class="form-control">
                                        <option value="about">About & Bio</option>
                                        <option value="videos">Model Videos</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label>Max Pages:</label>
                                    <input type="number" id="apifyMaxPage" class="form-control" value="1" min="1" max="10">
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-8">
                                <div class="form-group">
                                    <label>Custom Apify API Token (Optional if set in .env):</label>
                                    <input type="password" id="apifyCustomToken" class="form-control" placeholder="apify_api_...">
                                </div>
                            </div>
                            <div class="col-md-4">
                                <label>&nbsp;</label>
                                <button type="submit" id="btnRunApify" class="btn btn-success btn-block">
                                    <i class="fa fa-play"></i> Run Apify Scraper
                                </button>
                            </div>
                        </div>
                    </form>

                    <div id="apifyAlert" style="margin-top: 15px; display: none;"></div>

                    <div id="apifyLoading" style="display: none; text-align: center; padding: 40px;">
                        <i class="fa fa-refresh fa-spin fa-3x" style="color: #27ae60;"></i>
                        <p style="margin-top: 10px; font-weight: bold; color: #555;">Running Apify Actor in Cloud... This may take 10-30 seconds.</p>
                    </div>

                    <div id="apifyResultsContainer" style="margin-top: 25px; display: none;">
                        <h4>Extracted Performer Details:</h4>
                        <div class="table-responsive">
                            <table class="table table-bordered table-striped" id="apifyResultsTable">
                                <thead>
                                    <tr>
                                        <th>Avatar</th>
                                        <th>Name</th>
                                        <th>Details / Bio</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody id="apifyResultsBody"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ================= TAB 3: Setup & Docs ================= -->
            <div role="tabpanel" class="tab-pane" id="help-tab">
                <div class="scraper-card">
                    <div class="scraper-header">
                        <h3><i class="fa fa-book"></i> Installation & Setup Guide</h3>
                    </div>
                    <div class="alert alert-info">
                        <h4><i class="fa fa-info-circle"></i> Service Architecture for niksex</h4>
                        <p>The scraping engine runs as a companion Node.js microservice on port <code>3001</code> and communicates with <code>AdultColony-API</code> and <code>Apify Client</code>.</p>
                    </div>

                    <h4>1. Starting Companion Microservices:</h4>
                    <pre><code># Navigate to companion scraper service
cd services/scraper-api
npm install
npm start

# In another terminal, start AdultColony API:
cd services/adultcolony-api
npm install
npm run build
npm run start</code></pre>

                    <h4 style="margin-top: 20px;">2. Environment Configurations (.env):</h4>
                    <pre><code>SCRAPER_BRIDGE_URL=http://127.0.0.1:3001
ADULTCOLONY_API_URL=http://127.0.0.1:3000
APIFY_API_TOKEN=your_apify_api_token_here</code></pre>
                </div>
            </div>

        </div>
    </div>
</div>

<script>
    // Perform search via AJAX
    function performSearch(e) {
        e.preventDefault();
        var source = $('#scraperSource').val();
        var query = $('#searchQuery').val();
        var categoryId = $('#targetCategory').val();

        $('#loadingIndicator').show();
        $('#resultsGrid').empty();
        $('#searchAlert').hide();
        $('#btnSearch').prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Searching...');

        $.ajax({
            url: '{{ URL("admincp/auto-scraper/search") }}',
            type: 'POST',
            data: {
                _token: '{{ csrf_token() }}',
                source: source,
                query: query,
                page: 1
            },
            success: function(response) {
                $('#loadingIndicator').hide();
                $('#btnSearch').prop('disabled', false).html('<i class="fa fa-search"></i> Search Videos');

                if (!response.success && response.message) {
                    $('#searchAlert').removeClass().addClass('alert alert-warning').html(response.message).show();
                    return;
                }

                var items = [];
                if (response.data && Array.isArray(response.data)) {
                    items = response.data;
                } else if (response.data && response.data.results) {
                    items = response.data.results;
                } else if (response.data && response.data.videos) {
                    items = response.data.videos;
                }

                if (items.length === 0) {
                    $('#searchAlert').removeClass().addClass('alert alert-info').html('No videos found for query "' + query + '".').show();
                    return;
                }

                renderVideoResults(items, categoryId);
            },
            error: function(xhr) {
                $('#loadingIndicator').hide();
                $('#btnSearch').prop('disabled', false).html('<i class="fa fa-search"></i> Search Videos');
                $('#searchAlert').removeClass().addClass('alert alert-danger').html('Failed to connect to Scraper service. Please make sure the service is running.').show();
            }
        });
    }

    // Render video results grid
    function renderVideoResults(items, categoryId) {
        var grid = $('#resultsGrid');
        grid.empty();

        items.forEach(function(item, index) {
            var title = item.title || 'Video ' + (index + 1);
            var thumb = item.thumbnail || item.poster || '{{ URL("public/assets/images/no-image.jpg") }}';
            var duration = item.duration || '00:00';
            var videoJson = encodeURIComponent(JSON.stringify(item));

            var col = $('<div class="col-md-3 col-sm-6"></div>');
            var card = `
                <div class="video-card">
                    <div class="video-thumb-container">
                        <img src="${thumb}" onerror="this.src='{{ URL('public/assets/images/no-image.jpg') }}'">
                        <span class="video-duration">${duration}</span>
                    </div>
                    <div class="video-body">
                        <div class="video-title" title="${title}">${title}</div>
                        <button class="btn btn-sm btn-success btn-block btn-import" data-video="${videoJson}" data-category="${categoryId}" onclick="importSingleVideo(this)">
                            <i class="fa fa-download"></i> Import to niksex
                        </button>
                    </div>
                </div>
            `;
            col.append(card);
            grid.append(col);
        });
    }

    // Import a single video
    function importSingleVideo(btn) {
        var $btn = $(btn);
        var videoData = JSON.parse(decodeURIComponent($btn.attr('data-video')));
        var categoryId = $('#targetCategory').val();

        $btn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Importing...');

        $.ajax({
            url: '{{ URL("admincp/auto-scraper/import") }}',
            type: 'POST',
            data: {
                _token: '{{ csrf_token() }}',
                video: videoData,
                category_id: categoryId
            },
            success: function(res) {
                if (res.success) {
                    $btn.removeClass('btn-success').addClass('btn-default').html('<i class="fa fa-check text-success"></i> Imported!');
                } else {
                    $btn.prop('disabled', false).removeClass('btn-success').addClass('btn-warning').html('<i class="fa fa-exclamation"></i> Exists');
                    alert(res.message);
                }
            },
            error: function() {
                $btn.prop('disabled', false).html('<i class="fa fa-times"></i> Error');
                alert('Import request failed.');
            }
        });
    }

    // Run Apify Actor Scrape
    function runApifyScrape(e) {
        e.preventDefault();
        var profileUrl = $('#apifyProfileUrl').val();
        var profileType = $('#apifyProfileType').val();
        var maxPage = $('#apifyMaxPage').val();
        var token = $('#apifyCustomToken').val();

        $('#apifyLoading').show();
        $('#apifyResultsContainer').hide();
        $('#apifyAlert').hide();
        $('#btnRunApify').prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Running...');

        $.ajax({
            url: '{{ URL("admincp/apify-scraper/scrape") }}',
            type: 'POST',
            data: {
                _token: '{{ csrf_token() }}',
                profile_url: profileUrl,
                profile_type: profileType,
                max_page: maxPage,
                token: token
            },
            success: function(res) {
                $('#apifyLoading').hide();
                $('#btnRunApify').prop('disabled', false).html('<i class="fa fa-play"></i> Run Apify Scraper');

                if (res.success && res.items && res.items.length > 0) {
                    renderApifyResults(res.items);
                } else if (res.success && (!res.items || res.items.length === 0)) {
                    $('#apifyAlert').removeClass().addClass('alert alert-info').html('Actor finished with 0 items. Dataset ID: ' + res.datasetId).show();
                } else {
                    $('#apifyAlert').removeClass().addClass('alert alert-danger').html('Apify Error: ' + (res.message || 'Unknown error')).show();
                }
            },
            error: function(xhr) {
                $('#apifyLoading').hide();
                $('#btnRunApify').prop('disabled', false).html('<i class="fa fa-play"></i> Run Apify Scraper');
                $('#apifyAlert').removeClass().addClass('alert alert-danger').html('Failed to execute Apify scrape request. Check Token and Microservice.').show();
            }
        });
    }

    // Render Apify items in table
    function renderApifyResults(items) {
        var tbody = $('#apifyResultsBody');
        tbody.empty();

        items.forEach(function(item) {
            var name = item.name || item.model_name || item.username || 'Performer';
            var avatar = item.avatar || item.image || item.thumbnail || '{{ URL("public/assets/images/no-image.jpg") }}';
            var bio = item.bio || item.about || item.description || 'No description available';
            var profileJson = encodeURIComponent(JSON.stringify(item));

            var row = `
                <tr>
                    <td style="width: 80px;"><img src="${avatar}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 50%;"></td>
                    <td><strong>${name}</strong></td>
                    <td style="font-size: 12px; max-width: 350px;">${bio}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" data-profile="${profileJson}" onclick="importPornstarProfile(this)">
                            <i class="fa fa-save"></i> Save Performer
                        </button>
                    </td>
                </tr>
            `;
            tbody.append(row);
        });

        $('#apifyResultsContainer').show();
    }

    // Import Pornstar Profile
    function importPornstarProfile(btn) {
        var $btn = $(btn);
        var profileData = JSON.parse(decodeURIComponent($btn.attr('data-profile')));

        $btn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Saving...');

        $.ajax({
            url: '{{ URL("admincp/apify-scraper/import-pornstar") }}',
            type: 'POST',
            data: {
                _token: '{{ csrf_token() }}',
                profile: profileData
            },
            success: function(res) {
                if (res.success) {
                    $btn.removeClass('btn-primary').addClass('btn-success').html('<i class="fa fa-check"></i> Saved!');
                } else {
                    $btn.prop('disabled', false).addClass('btn-warning').html('Exists');
                    alert(res.message);
                }
            },
            error: function() {
                $btn.prop('disabled', false).html('Error');
                alert('Save failed.');
            }
        });
    }
</script>
@endsection
