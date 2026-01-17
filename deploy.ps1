# Quick Deploy Script for Google Cloud Run
# Usage: .\deploy.ps1

Write-Host "🚀 Deploying WingMann Waitlist to Google Cloud Run..." -ForegroundColor Green

# Check if gcloud is installed
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Google Cloud SDK not found. Please install it first:" -ForegroundColor Red
    Write-Host "   https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Get project ID
$projectId = Read-Host "Enter your GCP Project ID (or press Enter to use default)"
if ([string]::IsNullOrWhiteSpace($projectId)) {
    $projectId = gcloud config get-value project 2>$null
    if ([string]::IsNullOrWhiteSpace($projectId)) {
        Write-Host "❌ No project set. Please run: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Red
        exit 1
    }
}

Write-Host "📦 Project: $projectId" -ForegroundColor Cyan

# Get download key
$downloadKey = Read-Host "Enter your DOWNLOAD_KEY (or press Enter to skip)"
if ([string]::IsNullOrWhiteSpace($downloadKey)) {
    $downloadKey = "CHANGE_THIS_IN_PRODUCTION"
    Write-Host "⚠️  Using default DOWNLOAD_KEY. Change it in production!" -ForegroundColor Yellow
}

# Get region
$region = Read-Host "Enter region (default: us-central1)"
if ([string]::IsNullOrWhiteSpace($region)) {
    $region = "us-central1"
}

Write-Host "`n🔨 Building container image..." -ForegroundColor Cyan
gcloud builds submit --tag gcr.io/$projectId/wingmann-waitlist

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n🚀 Deploying to Cloud Run..." -ForegroundColor Cyan
gcloud run deploy wingmann-waitlist `
    --image gcr.io/$projectId/wingmann-waitlist `
    --platform managed `
    --region $region `
    --allow-unauthenticated `
    --memory 512Mi `
    --cpu 1 `
    --min-instances 0 `
    --max-instances 2 `
    --set-env-vars "DOWNLOAD_KEY=$downloadKey"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Deployment successful!" -ForegroundColor Green
Write-Host "`n📋 Getting service URL..." -ForegroundColor Cyan
$url = gcloud run services describe wingmann-waitlist --region $region --format="value(status.url)"

Write-Host "`n🌐 Your application is live at:" -ForegroundColor Green
Write-Host "   $url" -ForegroundColor Yellow
Write-Host "`n💡 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Update your frontend API URL to: $url" -ForegroundColor White
Write-Host "   2. Test the deployment: $url/api/health" -ForegroundColor White
Write-Host "   3. Monitor costs: https://console.cloud.google.com/billing" -ForegroundColor White
