-- VoiceOps Sample Database Schema
-- For local chatbot development

-- Organizations
CREATE TABLE orgs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reps/Agents
CREATE TABLE integration_persons (
  id SERIAL PRIMARY KEY,
  org_id INT REFERENCES orgs(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  latest_supervisor TEXT,
  department TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Calls
CREATE TABLE calls (
  id SERIAL PRIMARY KEY,
  org_id INT REFERENCES orgs(id),
  integration_person_id INT REFERENCES integration_persons(id),
  occurred_at TIMESTAMP NOT NULL,
  length_seconds INT,
  summary TEXT,
  state TEXT DEFAULT 'COMPLETE',
  external_identifier TEXT,
  customer_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Utterances (transcript lines)
CREATE TABLE utterances (
  id SERIAL PRIMARY KEY,
  call_id INT REFERENCES calls(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_rep BOOLEAN NOT NULL,
  start_time INT NOT NULL, -- milliseconds
  end_time INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Call metadata (key-value pairs per call)
CREATE TABLE call_metadata (
  id BIGSERIAL,
  call_id INT REFERENCES calls(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  string_value TEXT,
  number_value FLOAT,
  boolean_value BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (call_id, id),
  UNIQUE (call_id, key)
);

-- Coaching skills (what we evaluate reps on)
CREATE TABLE coaching_skills (
  id SERIAL PRIMARY KEY,
  org_id INT REFERENCES orgs(id),
  title TEXT NOT NULL,
  description TEXT,
  weight FLOAT DEFAULT 1.0,
  state TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Skill classifications per call
CREATE TABLE comment_suggestions (
  id SERIAL PRIMARY KEY,
  call_id INT REFERENCES calls(id) ON DELETE CASCADE,
  skill_id INT REFERENCES coaching_skills(id),
  class TEXT NOT NULL, -- e.g., 'GOOD', 'NEEDS_IMPROVEMENT', 'CRITICAL'
  comment TEXT,
  relevant_snippet TEXT,
  resolution TEXT DEFAULT 'UNREVIEWED',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Coaching documents
CREATE TABLE coaching_documents (
  id SERIAL PRIMARY KEY,
  org_id INT REFERENCES orgs(id),
  rep_id INT REFERENCES integration_persons(id),
  title TEXT,
  status TEXT DEFAULT 'DRAFT',
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_calls_org ON calls(org_id);
CREATE INDEX idx_calls_rep ON calls(integration_person_id);
CREATE INDEX idx_calls_occurred ON calls(occurred_at);
CREATE INDEX idx_utterances_call ON utterances(call_id);
CREATE INDEX idx_utterances_time ON utterances(call_id, start_time);
CREATE INDEX idx_metadata_call_key ON call_metadata(call_id, key);
CREATE INDEX idx_comment_suggestions_call ON comment_suggestions(call_id);
CREATE INDEX idx_comment_suggestions_skill ON comment_suggestions(skill_id);

-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- Org
INSERT INTO orgs (id, name) VALUES (1, 'Acme Insurance');

-- Reps
INSERT INTO integration_persons (id, org_id, first_name, last_name, email, latest_supervisor, department) VALUES
(1, 1, 'Sarah', 'Johnson', 'sarah.j@acme.com', 'Mike Chen', 'Sales'),
(2, 1, 'James', 'Williams', 'james.w@acme.com', 'Mike Chen', 'Sales'),
(3, 1, 'Maria', 'Garcia', 'maria.g@acme.com', 'Lisa Park', 'Sales'),
(4, 1, 'David', 'Brown', 'david.b@acme.com', 'Lisa Park', 'Sales'),
(5, 1, 'Emily', 'Davis', 'emily.d@acme.com', 'Mike Chen', 'Customer Service'),
(6, 1, 'Robert', 'Martinez', 'robert.m@acme.com', 'Lisa Park', 'Customer Service');

-- Skills
INSERT INTO coaching_skills (id, org_id, title, description, weight) VALUES
(1, 1, 'Discovery Questions', 'Rep asks effective questions to understand customer needs', 1.5),
(2, 1, 'Objection Handling', 'Rep addresses customer concerns professionally', 2.0),
(3, 1, 'Price Presentation', 'Rep presents pricing clearly and handles price objections', 1.8),
(4, 1, 'Closing Technique', 'Rep moves toward commitment appropriately', 1.5),
(5, 1, 'Empathy & Rapport', 'Rep builds connection and shows understanding', 1.0),
(6, 1, 'Product Knowledge', 'Rep demonstrates accurate product information', 1.2);

-- Generate calls with transcripts
DO $$
DECLARE
  call_id_var INT;
  rep_id_var INT;
  call_date TIMESTAMP;
  call_length INT;
  i INT;
  j INT;
  utterance_offset INT;
BEGIN
  FOR i IN 1..200 LOOP
    rep_id_var := (i % 6) + 1;
    call_date := NOW() - (random() * 90 || ' days')::INTERVAL;
    call_length := 120 + floor(random() * 600)::INT;
    
    INSERT INTO calls (org_id, integration_person_id, occurred_at, length_seconds, state, customer_name, summary)
    VALUES (
      1, rep_id_var, call_date, call_length, 'COMPLETE',
      (ARRAY['John Smith', 'Jane Doe', 'Bob Wilson', 'Alice Brown', 'Tom Clark', 'Sue Lee', 'Mike Ross', 'Pat Gray'])[floor(random()*8)+1],
      CASE WHEN random() > 0.3 THEN
        (ARRAY[
          'Customer called about home insurance renewal. Rep discussed coverage options and quoted a premium. Customer said they would think about it.',
          'Outbound follow-up call. Rep reviewed the previous quote and offered a bundle discount. Customer agreed to proceed with the policy.',
          'New home purchase call. Rep gathered property details and quoted coverage. Customer comparing with competitors.',
          'Customer called to cancel policy due to price increase. Rep offered adjusted coverage to reduce premium. Customer decided to stay.',
          'Transfer from online quote. Rep verified details and walked through coverage options. Customer bound the policy on the call.'
        ])[floor(random()*5)+1]
      ELSE 'Call too short to summarize.' END
    ) RETURNING id INTO call_id_var;
    
    -- Add metadata
    INSERT INTO call_metadata (call_id, key, string_value) VALUES
    (call_id_var, 'direction', (ARRAY['inbound', 'outbound'])[floor(random()*2)+1]),
    (call_id_var, 'contact_state', (ARRAY['TX', 'CA', 'FL', 'NY', 'GA'])[floor(random()*5)+1]),
    (call_id_var, 'disposition', (ARRAY['Sale', 'Follow Up', 'No Sale', 'Voicemail', 'Transfer'])[floor(random()*5)+1]);
    
    -- Add utterances (5-20 per call)
    utterance_offset := 0;
    FOR j IN 1..(5 + floor(random() * 15)::INT) LOOP
      utterance_offset := utterance_offset + 2000 + floor(random() * 5000)::INT;
      INSERT INTO utterances (call_id, content, is_rep, start_time, end_time) VALUES
      (call_id_var,
       CASE WHEN j % 2 = 1 THEN
         (ARRAY[
           'Hi, thanks for calling Acme Insurance. How can I help you today?',
           'I see your current policy is coming up for renewal. Let me pull that up.',
           'So based on what you told me, I can offer you a premium of about twenty-four hundred annually.',
           'I understand the concern about price. Let me see what we can do with the coverage to bring that down.',
           'Would you like me to go ahead and get that started for you today?',
           'Let me walk you through the coverage options we have available.',
           'I can definitely help with that. Can you tell me a bit about the property?',
           'That''s a great question. Our policy covers wind and hail damage as well.'
         ])[floor(random()*8)+1]
       ELSE
         (ARRAY[
           'Yeah, I''m looking at my renewal and the price went up quite a bit.',
           'I''m currently paying about eighteen hundred with State Farm.',
           'That''s higher than what I was hoping for. Can you match their price?',
           'OK let me think about it and get back to you.',
           'Sure, let''s go ahead and do it.',
           'What does the coverage include exactly?',
           'I just bought a new home and need insurance before closing.',
           'Can I bundle my auto with this?'
         ])[floor(random()*8)+1]
       END,
       j % 2 = 1,
       utterance_offset,
       utterance_offset + 1500 + floor(random() * 3000)::INT
      );
    END LOOP;
    
    -- Add skill scores (2-4 per call)
    FOR j IN 1..(2 + floor(random() * 3)::INT) LOOP
      INSERT INTO comment_suggestions (call_id, skill_id, class, comment, relevant_snippet) VALUES
      (call_id_var,
       (ARRAY[1,2,3,4,5,6])[floor(random()*6)+1],
       (ARRAY['GOOD', 'GOOD', 'NEEDS_IMPROVEMENT', 'CRITICAL', 'GOOD'])[floor(random()*5)+1],
       (ARRAY[
         'Rep effectively uncovered customer needs through targeted questions.',
         'Rep missed opportunity to address the price objection directly.',
         'Strong close attempt with clear next steps.',
         'Rep demonstrated thorough product knowledge.',
         'Could improve empathy when customer expressed frustration.',
         'Good use of assumptive language to move toward close.'
       ])[floor(random()*6)+1],
       NULL
      );
    END LOOP;
  END LOOP;
END $$;

-- Verify
SELECT 'orgs' as table_name, COUNT(*) as rows FROM orgs
UNION ALL SELECT 'integration_persons', COUNT(*) FROM integration_persons
UNION ALL SELECT 'calls', COUNT(*) FROM calls
UNION ALL SELECT 'utterances', COUNT(*) FROM utterances
UNION ALL SELECT 'call_metadata', COUNT(*) FROM call_metadata
UNION ALL SELECT 'coaching_skills', COUNT(*) FROM coaching_skills
UNION ALL SELECT 'comment_suggestions', COUNT(*) FROM comment_suggestions;

-- Product Insights
CREATE TABLE insight_projects (
  id SERIAL PRIMARY KEY,
  org_id INT REFERENCES orgs(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'ACTIVE',
  extraction_shape JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE insight_raw_extractions (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES insight_projects(id),
  call_id INT REFERENCES calls(id) ON DELETE CASCADE,
  extracted_data JSONB NOT NULL,
  shape_version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_extractions_project ON insight_raw_extractions(project_id);
CREATE INDEX idx_extractions_call ON insight_raw_extractions(call_id);

-- Insight project
INSERT INTO insight_projects (id, org_id, title, description, extraction_shape) VALUES
(1, 1, 'Competitive Intelligence', 'Track competitor mentions and pricing dynamics', '{
  "competitive_landscape": {
    "fields": [
      {"key": "competitor_name", "type": "text", "description": "Name of competitor mentioned"},
      {"key": "competitor_price", "type": "numeric", "description": "Competitor annual premium if mentioned"},
      {"key": "our_price", "type": "numeric", "description": "Our quoted annual premium"},
      {"key": "price_gap", "type": "numeric", "description": "Our price minus competitor price"},
      {"key": "customer_price_reaction", "type": "enum", "values": ["ACCEPTABLE", "TOO_HIGH", "STICKER_SHOCK", "NOT_DISCUSSED"]}
    ]
  },
  "objection_handling": {
    "fields": [
      {"key": "objection_type", "type": "enum", "values": ["PRICE", "COVERAGE", "TRUST", "TIMING", "NONE"]},
      {"key": "rep_response", "type": "enum", "values": ["ADJUSTED_COVERAGE", "EXPLAINED_VALUE", "HELD_FIRM", "OFFERED_DISCOUNT", "IGNORED"]},
      {"key": "outcome_after_objection", "type": "enum", "values": ["CLOSED", "PROGRESSING", "LOST"]}
    ]
  }
}'::jsonb);

-- Generate extractions for calls
DO $$
DECLARE
  c RECORD;
  competitors TEXT[] := ARRAY['State Farm', 'Allstate', 'Progressive', 'GEICO', 'Farmers'];
  reactions TEXT[] := ARRAY['ACCEPTABLE', 'TOO_HIGH', 'STICKER_SHOCK', 'NOT_DISCUSSED'];
  objections TEXT[] := ARRAY['PRICE', 'COVERAGE', 'TRUST', 'TIMING', 'NONE'];
  responses TEXT[] := ARRAY['ADJUSTED_COVERAGE', 'EXPLAINED_VALUE', 'HELD_FIRM', 'OFFERED_DISCOUNT', 'IGNORED'];
  outcomes TEXT[] := ARRAY['CLOSED', 'PROGRESSING', 'LOST'];
  comp_price INT;
  our_price INT;
BEGIN
  FOR c IN SELECT id FROM calls ORDER BY id LIMIT 150 LOOP
    comp_price := 1500 + floor(random() * 3000)::INT;
    our_price := comp_price + (-500 + floor(random() * 2000)::INT);
    INSERT INTO insight_raw_extractions (project_id, call_id, extracted_data) VALUES
    (1, c.id, json_build_object(
      'competitive_landscape', json_build_object(
        'competitor_name', competitors[floor(random()*5)+1],
        'competitor_price', comp_price,
        'our_price', our_price,
        'price_gap', our_price - comp_price,
        'customer_price_reaction', reactions[floor(random()*4)+1]
      ),
      'objection_handling', json_build_object(
        'objection_type', objections[floor(random()*5)+1],
        'rep_response', responses[floor(random()*5)+1],
        'outcome_after_objection', outcomes[floor(random()*3)+1]
      )
    )::jsonb);
  END LOOP;
END $$;

-- Add more coaching skills
INSERT INTO coaching_skills (id, org_id, title, description, weight) VALUES
(7, 1, 'Cross-sell Attempt', 'Rep identifies and presents relevant additional products', 1.3),
(8, 1, 'Agenda Setting', 'Rep sets clear expectations for the call at the start', 1.0);

-- Update summaries to be more diverse for remaining calls
UPDATE calls SET summary = (ARRAY[
  'Customer called about home insurance after receiving a non-renewal notice from their current carrier. Rep quoted coverage and customer was comparing against two competitors. Rep offered bundle discount which brought the price closer. Customer said they would call back after speaking with spouse.',
  'Outbound call to follow up on an online quote. Customer expressed concern about the deductible structure. Rep walked through coverage options line by line and adjusted personal property coverage to lower the premium by $400. Customer bound the policy.',
  'New home purchase — customer closing in 2 weeks and needs proof of insurance. Rep gathered property details quickly, quoted three tiers of coverage, and customer selected the mid-tier option. Payment taken on the call.',
  'Customer shopping due to 30% price increase at renewal. Currently with State Farm at $2100. Rep quoted at $2800 initially, then adjusted wind/hail deductible to 5% bringing it to $2400. Customer said still too high and ended the call.',
  'Warm transfer from AI assistant. Customer confused about coverage differences between us and their current carrier. Rep explained agreed value vs actual cash value clearly. Customer appreciated the explanation and asked for quote to be emailed.',
  'Retention call — customer wants to cancel due to finding cheaper rate elsewhere. Rep reviewed their claims history, pointed out the agreed value benefit they would lose, and offered to review coverage for savings. Customer agreed to keep the policy after a $200 annual reduction.',
  'First-time buyer call. Customer has a classic car and needs specialty coverage. Rep asked about storage, usage, and mileage. Quoted collector policy at $800/year. Customer excited about the price and bound immediately.'
])[floor(random()*7)+1]
WHERE summary = 'Call too short to summarize.' OR summary IS NULL;

