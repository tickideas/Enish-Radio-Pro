#!/bin/bash

# Coolify Deployment Quick Start Script
# This script helps you test the Docker build locally before deploying to Coolify

set -e

echo "🚀 Enish Radio Pro - Coolify Deployment Setup"
echo "=============================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file. Please edit it with your configuration."
        echo ""
        echo "Required variables:"
        echo "  - DATABASE_URL"
        echo "  - JWT_SECRET (generate with: openssl rand -base64 32)"
        echo "  - CLOUDINARY_* credentials"
        echo ""
        read -p "Press Enter after updating .env file..."
    else
        echo "❌ .env.example not found!"
        exit 1
    fi
fi

echo ""
echo "What would you like to do?"
echo ""
echo "1) Test Docker build (build image locally)"
echo "2) Test with docker-compose (full stack with PostgreSQL)"
echo "3) Generate JWT secret"
echo "4) Show deployment checklist"
echo "5) Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🔨 Building Docker image..."
        docker build -t enish-radio-backend:test .
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Docker build successful!"
            echo ""
            echo "To run the container locally:"
            echo "  docker run -p 3000:3000 --env-file .env enish-radio-backend:test"
            echo ""
            echo "To test the image:"
            echo "  curl http://localhost:3000/api/health"
        else
            echo "❌ Docker build failed. Check the errors above."
            exit 1
        fi
        ;;
    
    2)
        echo ""
        echo "🐳 Starting services with docker-compose..."
        echo ""
        
        # Check if Cloudinary env vars are set
        if ! grep -q "CLOUDINARY_CLOUD_NAME=your-cloud-name" .env; then
            echo "⚠️  Make sure to set your Cloudinary credentials in .env"
        fi
        
        docker-compose up -d
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Services started successfully!"
            echo ""
            echo "Waiting for services to be ready..."
            sleep 10
            
            # Check database
            docker-compose exec -T postgres pg_isready -U enish_user -d enish_radio_pro
            
            if [ $? -eq 0 ]; then
                echo "✅ Database is ready"
                
                # Initialize schema
                echo ""
                read -p "Initialize database schema? (y/n): " init_db
                if [ "$init_db" = "y" ]; then
                    echo "Creating database schema..."
                    docker-compose exec -T backend npm run create-schema
                    
                    echo ""
                    read -p "Create admin user? (y/n): " create_admin
                    if [ "$create_admin" = "y" ]; then
                        docker-compose exec -T backend node scripts/seedAdmin.js
                    fi
                fi
            fi
            
            echo ""
            echo "📊 Service Status:"
            docker-compose ps
            echo ""
            echo "🔗 Endpoints:"
            echo "  - API Health: http://localhost:3000/api/health"
            echo "  - Admin Panel: http://localhost:3000/admin/"
            echo ""
            echo "📝 View logs:"
            echo "  docker-compose logs -f backend"
            echo ""
            echo "🛑 Stop services:"
            echo "  docker-compose down"
            echo ""
            echo "Testing API health..."
            sleep 5
            curl -s http://localhost:3000/api/health | json_pp || echo "API not ready yet, please wait a moment"
        else
            echo "❌ Failed to start services. Check docker-compose logs."
            exit 1
        fi
        ;;
    
    3)
        echo ""
        echo "🔐 Generating JWT secret..."
        echo ""
        JWT_SECRET=$(openssl rand -base64 32)
        echo "Your JWT secret:"
        echo ""
        echo "  JWT_SECRET=$JWT_SECRET"
        echo ""
        echo "Add this to your .env file or Coolify environment variables."
        ;;
    
    4)
        echo ""
        echo "📋 Coolify Deployment Checklist"
        echo "================================"
        echo ""
        echo "Before deploying to Coolify:"
        echo ""
        echo "□ PostgreSQL database created in Coolify (or external DB ready)"
        echo "□ Database connection string obtained"
        echo "□ JWT secret generated (use option 3)"
        echo "□ Cloudinary account created and credentials obtained"
        echo "□ Domain name configured (optional but recommended)"
        echo "□ .env.coolify reviewed and ready to copy"
        echo ""
        echo "In Coolify:"
        echo ""
        echo "□ Create new Application"
        echo "□ Connect to GitHub repository"
        echo "□ Set build path to 'backend/'"
        echo "□ Configure all environment variables"
        echo "□ Set health check to '/api/health'"
        echo "□ Configure domain and enable HTTPS"
        echo "□ Deploy application"
        echo ""
        echo "After deployment:"
        echo ""
        echo "□ Run 'npm run create-schema' in Coolify shell"
        echo "□ Run 'node scripts/seedAdmin.js' to create admin user"
        echo "□ Test health endpoint"
        echo "□ Access admin panel"
        echo "□ Update mobile app with production API URL"
        echo "□ Enable database backups"
        echo ""
        echo "See COOLIFY_DEPLOYMENT.md for detailed instructions."
        ;;
    
    5)
        echo "👋 Goodbye!"
        exit 0
        ;;
    
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
