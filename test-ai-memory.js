#!/usr/bin/env node

const BASE_URL = 'http://localhost:3001';

async function testAIMemory() {
  console.log('===========================================');
  console.log('Testing AI Memory API');
  console.log('===========================================\n');

  // Test 1: Store a memory
  console.log('1. Storing memory...');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/ai/memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test-user',
        type: 'preference',
        category: 'drums',
        content: 'I love hard-hitting trap drums with 808s',
        importance: 9
      })
    });
    const data = await response.json();
    console.log('✅ Memory stored:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error storing memory:', error.message);
  }

  console.log('\n2. Storing another memory...');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/ai/memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test-user',
        type: 'preference',
        category: 'vocals',
        content: 'I prefer melodic vocal harmonies with autotune',
        importance: 7
      })
    });
    const data = await response.json();
    console.log('✅ Memory stored:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error storing memory:', error.message);
  }

  // Test 2: Retrieve memories
  console.log('\n3. Retrieving memories...');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/ai/memory/test-user?limit=10`);
    const data = await response.json();
    console.log('✅ Memories retrieved:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error retrieving memories:', error.message);
  }

  // Test 3: Delete a memory (if we have the ID)
  console.log('\n4. Retrieving to get memory ID for deletion test...');
  try {
    const response = await fetch(`${BASE_URL}/api/v1/ai/memory/test-user?limit=1`);
    const data = await response.json();
    if (data.memories && data.memories.length > 0) {
      const memoryId = data.memories[0].id;
      console.log(`Found memory ID: ${memoryId}`);

      console.log('\n5. Deleting memory...');
      const deleteResponse = await fetch(`${BASE_URL}/api/v1/ai/memory/${memoryId}`, {
        method: 'DELETE'
      });
      const deleteData = await deleteResponse.json();
      console.log('✅ Memory deleted:', JSON.stringify(deleteData, null, 2));
    } else {
      console.log('ℹ️  No memories to delete');
    }
  } catch (error) {
    console.error('❌ Error deleting memory:', error.message);
  }

  console.log('\n===========================================');
  console.log('AI Memory API Testing Complete!');
  console.log('===========================================');
}

testAIMemory();
