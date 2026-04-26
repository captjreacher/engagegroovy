const axios = require('axios');

const samplePayload = {
  content_id: "notion-123",
  source_system: "mgrnz",
  source_type: "notion",
  status: "approved_for_ingestion",
  title: "The Future of AI Agents",
  content_type: "article",
  body_markdown: "# The Future of AI Agents\n\nAI agents are becoming more autonomous...",
  summary: "An article about the evolution of AI agents in 2024.",
  tags: ["AI", "Tech", "Future"],
  requested_outputs: ["newsletter", "social_post"],
  review_required: true,
  submitted_by: "system-notion-sync",
  submitted_at: new Date().toISOString()
};

async function testIngest() {
  try {
    const response = await axios.post('http://localhost:3000/api/content-packages/ingest', samplePayload);
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testIngest();
