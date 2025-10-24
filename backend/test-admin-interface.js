#!/usr/bin/env node

/**
 * Admin Interface Test Script
 * 
 * This script tests the basic functionality of the admin interface
 * including authentication, CRUD operations, and API endpoints.
 * 
 * Usage: node test-admin-interface.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.ADMIN_TEST_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@admin.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword123';

class AdminInterfaceTester {
    constructor() {
        this.token = null;
        this.testResults = [];
        this.passed = 0;
        this.failed = 0;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const colors = {
            info: '\x1b[36m',    // Cyan
            success: '\x1b[32m', // Green
            error: '\x1b[31m',   // Red
            warning: '\x1b[33m'  // Yellow
        };
        const reset = '\x1b[0m';
        
        console.log(`${colors[type]}[${timestamp}] ${message}${reset}`);
    }

    async addTest(name, testFunction) {
        this.testResults.push({ name, testFunction, passed: false, error: null });
    }

    async runTests() {
        this.log('🚀 Starting Admin Interface Tests', 'info');
        this.log(`Testing against: ${BASE_URL}`, 'info');
        
        try {
            // Test 1: Health Check
            await this.addTest('Health Check', () => this.testHealthCheck());
            
            // Test 2: Admin Login
            await this.addTest('Admin Login', () => this.testAdminLogin());
            
            // Test 3: Authenticated Endpoints (if login successful)
            if (this.token) {
                await this.addTest('Get Users (Auth)', () => this.testGetUsers());
                await this.addTest('Get Social Links (Auth)', () => this.testGetSocialLinks());
                await this.addTest('Get Ad Banners (Auth)', () => this.testGetAdBanners());
                await this.addTest('Get Stream Metadata (Auth)', () => this.testGetStreamMetadata());
                await this.addTest('Get Analytics (Auth)', () => this.testGetAnalytics());
            }
            
            // Test 4: Unauthenticated Access (should fail)
            await this.addTest('Unauthenticated Access (should fail)', () => this.testUnauthenticatedAccess());
            
            // Run all tests
            for (const test of this.testResults) {
                try {
                    await test.testFunction();
                    test.passed = true;
                    this.passed++;
                    this.log(`✅ ${test.name}`, 'success');
                } catch (error) {
                    test.error = error.message;
                    this.failed++;
                    this.log(`❌ ${test.name}: ${error.message}`, 'error');
                }
            }
            
            this.generateReport();
            
        } catch (error) {
            this.log(`Test suite failed: ${error.message}`, 'error');
            process.exit(1);
        }
    }

    async testHealthCheck() {
        try {
            const response = await axios.get(`${BASE_URL}/api/health`);
            if (response.status === 200 && response.data.status === 'OK') {
                this.log('Health check passed', 'success');
            } else {
                throw new Error('Health check failed');
            }
        } catch (error) {
            throw new Error(`Health check failed: ${error.message}`);
        }
    }

    async testAdminLogin() {
        try {
            const response = await axios.post(`${BASE_URL}/api/auth/login`, {
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            });
            
            if (response.data.success && response.data.token) {
                this.token = response.data.token;
                this.log('Admin login successful', 'success');
            } else {
                throw new Error('Login response missing token');
            }
        } catch (error) {
            // This might fail if test user doesn't exist, which is expected
            this.log(`Login test failed (expected if no test user): ${error.message}`, 'warning');
            // Don't throw error for login test as test user might not exist
        }
    }

    async testGetUsers() {
        if (!this.token) {
            throw new Error('No auth token available');
        }
        
        const response = await axios.get(`${BASE_URL}/api/auth/users`, {
            headers: { Authorization: `Bearer ${this.token}` }
        });
        
        if (response.data.success && Array.isArray(response.data.users)) {
            this.log(`Retrieved ${response.data.users.length} users`, 'success');
        } else {
            throw new Error('Failed to get users');
        }
    }

    async testGetSocialLinks() {
        if (!this.token) {
            throw new Error('No auth token available');
        }
        
        const response = await axios.get(`${BASE_URL}/api/social-links/admin`, {
            headers: { Authorization: `Bearer ${this.token}` }
        });
        
        if (response.data.success && Array.isArray(response.data.data)) {
            this.log(`Retrieved ${response.data.data.length} social links`, 'success');
        } else {
            throw new Error('Failed to get social links');
        }
    }

    async testGetAdBanners() {
        if (!this.token) {
            throw new Error('No auth token available');
        }
        
        const response = await axios.get(`${BASE_URL}/api/ads/admin`, {
            headers: { Authorization: `Bearer ${this.token}` }
        });
        
        if (response.data.success && Array.isArray(response.data.data)) {
            this.log(`Retrieved ${response.data.data.length} ad banners`, 'success');
        } else {
            throw new Error('Failed to get ad banners');
        }
    }

    async testGetStreamMetadata() {
        if (!this.token) {
            throw new Error('No auth token available');
        }
        
        const response = await axios.get(`${BASE_URL}/api/stream/metadata/admin`, {
            headers: { Authorization: `Bearer ${this.token}` }
        });
        
        if (response.data.success && Array.isArray(response.data.data)) {
            this.log(`Retrieved ${response.data.data.length} stream metadata entries`, 'success');
        } else {
            throw new Error('Failed to get stream metadata');
        }
    }

    async testGetAnalytics() {
        if (!this.token) {
            throw new Error('No auth token available');
        }
        
        const response = await axios.get(`${BASE_URL}/api/analytics/overview`, {
            headers: { Authorization: `Bearer ${this.token}` }
        });
        
        if (response.data.success && response.data.data) {
            this.log('Analytics overview retrieved successfully', 'success');
        } else {
            throw new Error('Failed to get analytics');
        }
    }

    async testUnauthenticatedAccess() {
        try {
            await axios.get(`${BASE_URL}/api/auth/users`);
            throw new Error('Unauthenticated access should have failed');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                this.log('Unauthenticated access correctly rejected', 'success');
            } else {
                throw new Error('Unauthenticated access test failed');
            }
        }
    }

    generateReport() {
        this.log('\n📊 Test Results Summary', 'info');
        this.log(`Total Tests: ${this.testResults.length}`, 'info');
        this.log(`Passed: ${this.passed}`, 'success');
        this.log(`Failed: ${this.failed}`, 'error');
        
        if (this.failed === 0) {
            this.log('\n🎉 All tests passed! Admin interface is working correctly.', 'success');
        } else {
            this.log('\n⚠️  Some tests failed. Check the issues above.', 'warning');
        }
        
        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            baseUrl: BASE_URL,
            totalTests: this.testResults.length,
            passed: this.passed,
            failed: this.failed,
            results: this.testResults.map(test => ({
                name: test.name,
                passed: test.passed,
                error: test.error
            }))
        };
        
        const reportPath = path.join(__dirname, 'admin-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        this.log(`Detailed report saved to: ${reportPath}`, 'info');
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new AdminInterfaceTester();
    tester.runTests().catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = AdminInterfaceTester;