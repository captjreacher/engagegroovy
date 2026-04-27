const { validateIssueV1 } = require('../src/validators/issueSchema');

const VALID_PAYLOAD = {
  id: '00000000-0000-0000-0000-000000000001',
  title: 'Test Issue',
  domain: 'engineering',
  event_type: 'issue',
  schema: 'issue.v1',
  routing_path: '/issues/TEST-1',
  status: 'pending',
  created_at: '2026-04-26T12:00:00Z',
  updated_at: '2026-04-26T12:00:00Z'
};

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

function test(name, fn) {
  try {
    fn();
    console.log(`\n[test] ${name}: OK`);
  } catch (e) {
    console.error(`\n[test] ${name}: FAILED - ${e.message}`);
    process.exitCode = 1;
  }
}

test('valid payload passes', () => {
  const result = validateIssueV1({ ...VALID_PAYLOAD });
  assert(result.valid === true, 'valid payload should pass');
  assert(result.errors.length === 0, 'no errors');
});

test('missing required field fails', () => {
  const result = validateIssueV1({ ...VALID_PAYLOAD, title: undefined });
  assert(result.valid === false, 'missing title fails');
  assert(result.errors.includes('missing required field: title'), 'error mentions title');
});

test('invalid UUID fails', () => {
  const result = validateIssueV1({ ...VALID_PAYLOAD, id: 'not-a-uuid' });
  assert(result.valid === false, 'invalid uuid fails');
  assert(result.errors.includes('id must be a valid UUID'), 'error about UUID');
});

test('invalid status fails', () => {
  const result = validateIssueV1({ ...VALID_PAYLOAD, status: 'invalid' });
  assert(result.valid === false, 'invalid status fails');
  assert(result.errors.some(e => e.includes('status must be one of')), 'error about status enum');
});

test('invalid datetime fails', () => {
  const result = validateIssueV1({ ...VALID_PAYLOAD, created_at: 'not-a-date' });
  assert(result.valid === false, 'invalid datetime fails');
  assert(result.errors.includes('created_at must be a valid ISO date-time'), 'error about datetime');
});

test('attachments must be array of strings', () => {
  const result = validateIssueV1({ ...VALID_PAYLOAD, attachments: ['url1', 42, 'url3'] });
  assert(result.valid === false, 'mixed array fails');
  assert(result.errors.includes('attachments must be strings'), 'error about attachment type');
});

test('comments must have required fields', () => {
  const result = validateIssueV1({
    ...VALID_PAYLOAD,
    comments: [{ id: 'c1', author: 'u1' }]
  });
  assert(result.valid === false, 'missing comment fields fails');
  assert(result.errors.some(e => e.includes('comment missing required field')), 'error about missing comment field');
});

test('valid comments pass', () => {
  const result = validateIssueV1({
    ...VALID_PAYLOAD,
    comments: [{
      id: 'c1',
      author: 'u1',
      text: 'Hello',
      created_at: '2026-04-26T12:00:00Z'
    }]
  });
  assert(result.valid === true, 'valid comments pass');
});

test('non-object payload fails', () => {
  const result = validateIssueV1(null);
  assert(result.valid === false, 'null fails');
  assert(result.errors.includes('payload must be an object'), 'error about object');
});

console.log('\n--- All tests complete ---');