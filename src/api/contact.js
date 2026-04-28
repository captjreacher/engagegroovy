const express = require('express');
const axios = require('axios');
const { supabase } = require('../lib/supabase');

const router = express.Router();

// Contact form submission endpoint
router.post('/submit', async (req, res) => {
  try {
    const { name, email, company, challenge, timeline, budget, source, message } = req.body;

    // Basic validation
    if (!name || !email || !company || !challenge) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: name, email, company, and challenge are required.' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email address.' 
      });
    }

    // Store in Supabase if available
    if (supabase) {
      try {
        const { error } = await supabase
          .from('contact_submissions')
          .insert([
            {
              name,
              email,
              company,
              challenge,
              timeline,
              budget,
              source: source || 'direct',
              message,
              submitted_at: new Date().toISOString()
            }
          ]);
        
        if (error) {
          console.error('Supabase insert error:', error);
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }

    // Log the submission
    console.log('Contact form submission:', { name, email, company, source });

    // Return success
    return res.status(200).json({ 
      success: true, 
      message: 'Form submitted successfully.' 
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error. Please try again or email us directly at hello@engagegroovy.com.' 
    });
  }
});

module.exports = router;
