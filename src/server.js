require('dotenv').config();
const express = require('express');
const contentPackageRoutes = require('./api/content-packages');
const emailEventRoutes = require('./api/email-events');
const { handleEmailIngestion } = require('./ingestion/emailIngestion');
const validationRoutes = require('./api/validation');
const { handleContentPackageIngested } = require('./handlers/contentProcessor');
const { supabase } = require('./lib/supabase');

const app = express();
app.use(express.json());

// Routes
app.use('/api/content-packages', contentPackageRoutes);
app.use('/api/email-events', emailEventRoutes);
app.use('/api/validate', validationRoutes);

const PORT = process.env.PORT || 3000;

// Simple Event Loop Simulation
// In production, this would be a separate worker process or a Supabase Webhook.
async function startEventProcessor() {
  console.log('Event processor started. Listening for new events...');
  
  // Example of a simple polling mechanism if webhooks aren't used
  setInterval(async () => {
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'pending')
      .or('event_type.eq.content.package.ingested,event_type.eq.email.webhook.received')
      .limit(10);

    if (error) {
      console.error('Error fetching pending events:', error);
      return;
    }

    for (const event of events) {
      // Process content package ingested events via existing processor
      try {
        if (event.event_type === 'content.package.ingested') {
          await handleContentPackageIngested(event.payload);
        } else if (event.event_type === 'email.webhook.received') {
          // Inbound email ingestion: create a Paperclip issue from the email webhook payload
          try {
            await handleEmailIngestion(event.payload);
          } catch (ingestErr) {
            console.error('Email ingestion failed for event', event.id, ingestErr);
          }
        }
        
        // Mark as processed
        await supabase
          .from('events')
          .update({ status: 'processed' })
          .eq('id', event.id);
          
      } catch (e) {
        console.error(`Error processing event ${event.id}:`, e);
        await supabase
          .from('events')
          .update({ status: 'failed' })
          .eq('id', event.id);
      }
    }
  }, 5000); // Poll every 5 seconds
}

app.listen(PORT, () => {
  console.log(`Ingestion server running on port ${PORT}`);
  startEventProcessor();
});
