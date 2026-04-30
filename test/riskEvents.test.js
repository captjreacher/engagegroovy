const { buildRiskMapFlow } = require('../src/riskEvents');
const { validateIssueV1 } = require('../src/validators/issueSchema');

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

const SAMPLE_INPUT = {
  name: 'Riley Founder',
  email: 'Riley@Example.com',
  company: 'Example Co',
  website: 'https://example.com',
  ai_usage: 'customer_or_revenue_work',
  review_before_use: 'always_reviewed',
  output_process_impact: 'triggers_decisions_or_actions',
  process_structure: 'documented_owner_and_steps',
  manual_handoffs: 'few_and_clear',
  tooling_dependency: 'ai_embedded_in_core_system',
  notes: 'AI is being used in sales follow-up without a clear review gate.',
  source: 'risk-map'
};

test('buildRiskMapFlow emits the required event chain', () => {
  const flow = buildRiskMapFlow(SAMPLE_INPUT, {
    occurredAt: '2026-04-30T12:00:00.000Z',
    leadId: '00000000-0000-0000-0000-000000000010'
  });

  assert(flow.events.length === 4, 'four events emitted');
  assert(flow.events[0].event_type === 'lead.captured', 'first event captures lead');
  assert(flow.events[1].event_type === 'risk.profile.generated', 'second event generates risk profile');
  assert(flow.events[2].event_type === 'pipeline.recommended', 'third event recommends pipeline');
  assert(flow.events[3].event_type === 'paperclip.issue.prepared', 'fourth event prepares issue');
});

test('risk profile generated payload includes required AI risk fields', () => {
  const flow = buildRiskMapFlow(SAMPLE_INPUT, {
    occurredAt: '2026-04-30T12:00:00.000Z',
    leadId: '00000000-0000-0000-0000-000000000010'
  });

  const payload = flow.events[1].payload;
  assert(payload.risk_profile === 'ai_in_wrong_place', 'classifier returns the expected profile');
  assert(payload.risk_score === 70, 'risk score is deterministic');
  assert(Array.isArray(payload.signals) && payload.signals.length === 6, 'six AI risk signals are included');
  assert(Array.isArray(payload.control_gaps), 'control gaps are included');
  assert(payload.recommended_pipeline === 'ai_placement_control_sprint', 'recommended pipeline is included');
  assert(payload.priority === 'high', 'priority is included');
  assert(payload.next_action === 'ceo_review', 'next action is CEO review');
});

test('classifier returns exactly one allowed profile for each profile shape', () => {
  const cases = [
    {
      expected: 'uncontrolled_ai_usage',
      input: {
        ...SAMPLE_INPUT,
        review_before_use: 'no_owner',
        output_process_impact: 'internal_reference',
        process_structure: 'known_but_informal',
        manual_handoffs: 'few_and_clear',
        tooling_dependency: 'one_ai_tool'
      }
    },
    {
      expected: 'false_automation',
      input: {
        ...SAMPLE_INPUT,
        ai_usage: 'team_workflows',
        review_before_use: 'spot_checked',
        output_process_impact: 'shapes_work',
        process_structure: 'unclear_or_missing',
        manual_handoffs: 'hidden_rework_or_duplicate_entry',
        tooling_dependency: 'multiple_unconnected_tools'
      }
    },
    {
      expected: 'ai_in_wrong_place',
      input: SAMPLE_INPUT
    }
  ];

  cases.forEach((item) => {
    const flow = buildRiskMapFlow(item.input, {
      occurredAt: '2026-04-30T12:00:00.000Z',
      leadId: '00000000-0000-0000-0000-000000000010'
    });
    const profile = flow.risk_profile.risk_profile;
    assert(['uncontrolled_ai_usage', 'false_automation', 'ai_in_wrong_place'].includes(profile), `${profile} is allowed`);
    assert(profile === item.expected, `${item.expected} classification is deterministic`);
  });
});

test('prepared Paperclip issue validates against issue.v1', () => {
  const flow = buildRiskMapFlow(SAMPLE_INPUT, {
    occurredAt: '2026-04-30T12:00:00.000Z',
    leadId: '00000000-0000-0000-0000-000000000010'
  });

  const result = validateIssueV1(flow.paperclip_issue);
  assert(result.valid === true, `issue.v1 validation passes: ${result.errors.join(', ')}`);
});

console.log('\n--- Risk event tests complete ---');
