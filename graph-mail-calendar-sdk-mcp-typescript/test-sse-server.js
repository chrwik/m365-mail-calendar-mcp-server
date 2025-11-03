#!/usr/bin/env node

/**
 * Test script for the MCP SSE Server
 * Tests the SSE endpoint functionality
 */

import { EventSource } from 'eventsource';

const SSE_URL = 'http://localhost:3001/sse';

console.log('🧪 Testing MCP SSE Server...\n');

// Test 1: Health Check
console.log('1. Testing Health Check...');
try {
    const healthResponse = await fetch('http://localhost:3001/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData);
} catch (error) {
    console.error('❌ Health Check failed:', error.message);
}

// Test 2: Server Info  
console.log('\n2. Testing Server Info...');
try {
    const infoResponse = await fetch('http://localhost:3001/info');
    const infoData = await infoResponse.json();
    console.log('✅ Server Info:', infoData);
} catch (error) {
    console.error('❌ Server Info failed:', error.message);
}

// Test 3: SSE Connection
console.log('\n3. Testing SSE Connection...');
console.log('Connecting to:', SSE_URL);

const eventSource = new EventSource(SSE_URL);

eventSource.onopen = () => {
    console.log('✅ SSE connection opened');
};

eventSource.onmessage = (event) => {
    console.log('📨 Received SSE message:', event.data);
};

eventSource.onerror = (error) => {
    console.error('❌ SSE connection error:', error);
    eventSource.close();
};

// Close connection after 5 seconds
setTimeout(() => {
    console.log('\n🔌 Closing SSE connection...');
    eventSource.close();
    console.log('✅ Test completed!\n');
    
    console.log('🎯 Summary:');
    console.log('- SSE Endpoint ready for n8n MCP Client Tool');
    console.log('- Configure n8n with: http://localhost:3001/sse');
    console.log('- Health monitoring available at: http://localhost:3001/health');
    
    process.exit(0);
}, 5000);