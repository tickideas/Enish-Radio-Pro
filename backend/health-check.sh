#!/bin/bash

# Health Check Script for Enish Radio Pro Backend
# This script can be used for monitoring, alerts, or automated health checks

set -e

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
TIMEOUT="${TIMEOUT:-10}"
VERBOSE="${VERBOSE:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    
    case $status in
        "success")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "error")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        *)
            echo "$message"
            ;;
    esac
}

# Function to check endpoint
check_endpoint() {
    local endpoint=$1
    local expected_status=${2:-200}
    local description=$3
    
    if [ "$VERBOSE" = "true" ]; then
        echo "Checking: $description"
        echo "URL: $API_URL$endpoint"
    fi
    
    response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT "$API_URL$endpoint" 2>/dev/null)
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        print_status "success" "$description: HTTP $status_code"
        if [ "$VERBOSE" = "true" ]; then
            echo "Response: $body"
        fi
        return 0
    else
        print_status "error" "$description: Expected HTTP $expected_status, got HTTP $status_code"
        if [ "$VERBOSE" = "true" ] && [ -n "$body" ]; then
            echo "Response: $body"
        fi
        return 1
    fi
}

# Function to parse JSON (requires jq)
check_json_field() {
    local json=$1
    local field=$2
    local expected=$3
    
    if command -v jq &> /dev/null; then
        actual=$(echo "$json" | jq -r "$field")
        if [ "$actual" = "$expected" ]; then
            return 0
        else
            return 1
        fi
    else
        # Fallback to grep if jq is not available
        echo "$json" | grep -q "\"$field\".*\"$expected\""
        return $?
    fi
}

# Main health check
main() {
    echo "🏥 Enish Radio Pro Backend Health Check"
    echo "========================================"
    echo "Target: $API_URL"
    echo "Timeout: ${TIMEOUT}s"
    echo ""
    
    # Track failures
    failures=0
    
    # 1. Check health endpoint
    echo "1. Health Endpoint Check..."
    if check_endpoint "/api/health" 200 "Health endpoint"; then
        response=$(curl -s --max-time $TIMEOUT "$API_URL/api/health" 2>/dev/null)
        
        # Check database status if jq is available
        if command -v jq &> /dev/null; then
            db_status=$(echo "$response" | jq -r '.database.status')
            if [ "$db_status" = "connected" ]; then
                print_status "success" "Database: connected"
            else
                print_status "error" "Database: $db_status"
                ((failures++))
            fi
        fi
    else
        ((failures++))
    fi
    echo ""
    
    # 2. Check public endpoints
    echo "2. Public Endpoints Check..."
    if check_endpoint "/api/social-links/active" 200 "Social links (public)"; then
        : # Success
    else
        ((failures++))
    fi
    
    if check_endpoint "/api/ads" 200 "Ad banners (public)"; then
        : # Success
    else
        ((failures++))
    fi
    echo ""
    
    # 3. Check admin endpoint (should require auth)
    echo "3. Admin Endpoints Check..."
    if check_endpoint "/api/social-links/admin" 401 "Social links (admin - should require auth)"; then
        : # Success - 401 is expected without auth
    else
        print_status "warning" "Admin endpoint returned unexpected status"
    fi
    echo ""
    
    # 4. Check CORS headers (if verbose)
    if [ "$VERBOSE" = "true" ]; then
        echo "4. CORS Headers Check..."
        headers=$(curl -s -I --max-time $TIMEOUT "$API_URL/api/health" 2>/dev/null)
        
        if echo "$headers" | grep -q "Access-Control-Allow"; then
            print_status "success" "CORS headers present"
        else
            print_status "warning" "CORS headers not found"
        fi
        echo ""
    fi
    
    # 5. Response time check
    echo "Response Time Check..."
    start_time=$(date +%s%N)
    curl -s --max-time $TIMEOUT "$API_URL/api/health" > /dev/null 2>&1
    end_time=$(date +%s%N)
    response_time=$(( (end_time - start_time) / 1000000 ))
    
    if [ $response_time -lt 1000 ]; then
        print_status "success" "Response time: ${response_time}ms (excellent)"
    elif [ $response_time -lt 3000 ]; then
        print_status "warning" "Response time: ${response_time}ms (acceptable)"
    else
        print_status "error" "Response time: ${response_time}ms (slow)"
        ((failures++))
    fi
    echo ""
    
    # Summary
    echo "========================================"
    echo "Summary:"
    echo "--------"
    
    if [ $failures -eq 0 ]; then
        print_status "success" "All checks passed!"
        echo ""
        echo "✨ Backend is healthy and operational"
        exit 0
    else
        print_status "error" "$failures check(s) failed"
        echo ""
        echo "🔍 Please review the errors above"
        exit 1
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--url)
            API_URL="$2"
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -u, --url URL       API base URL (default: http://localhost:3000)"
            echo "  -t, --timeout SEC   Request timeout in seconds (default: 10)"
            echo "  -v, --verbose       Enable verbose output"
            echo "  -h, --help          Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                                    # Check localhost"
            echo "  $0 -u https://api.example.com         # Check production"
            echo "  $0 -u http://localhost:3000 -v        # Verbose mode"
            echo ""
            echo "Environment Variables:"
            echo "  API_URL       Base URL for the API"
            echo "  TIMEOUT       Request timeout in seconds"
            echo "  VERBOSE       Enable verbose output (true/false)"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

# Run main function
main
