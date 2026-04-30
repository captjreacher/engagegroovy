const {
  persistEvents,
  mapEventToRow,
  validateEventEnvelope
} = require('../archived-localhost-app/lib/events');
const { buildRiskMapFlow } = require('../src/riskEvents');

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`\n[test] ${name}: OK`);
  } catch (e) {
    console.error(`\n[test] ${name}: FAILED - ${e.message}`);
    process.exitCode = 1;
  }
}

const SAMPLE_INPUT = {
  name: 'Riley Founder',
  email: 'riley@example.com',
  company: 'Example Co',
  ai_usage: 'customer_or_revenue_work',
  review_before_use: 'always_reviewed',
  output_process_impact: 'triggers_decisions_or_actions',
  process_structure: 'documented_owner_and_steps',
  manual_handoffs: 'few_and_clear',
  tooling_dependency: 'ai_embedded_in_core_system'
};

function sampleEvents() {
  return buildRiskMapFlow(SAMPLE_INPUT, {
    occurredAt: '2026-04-30T12:00:00.000Z',
    leadId: '00000000-0000-0000-0000-000000000010'
  }).events;
}

function createMockSupabase(response) {
  const calls = [];
  return {
    calls,
    from(table) {
      calls.push({ table });
      return {
        insert(rows) {
          calls.push({ rows });
          return {
            async select() {
              return response(rows);
            }
          };
        }
      };
    }
  };
}

async function main() {
  await test('event payload shape maps to existing public.events schema', async () => {
    const event = sampleEvents()[1];
    const errors = validateEventEnvelope(event);
    const row = mapEventToRow(event);

    assert(errors.length === 0, 'event envelope is valid');
    assert(Object.keys(row).sort().join(',') === 'correlation_id,entity_id,entity_ref,entity_type,event_type,payload,source_system,status', 'insert row matches production public.events columns used by Risk Map');
    assert(row.event_type === 'risk.profile.generated', 'row event_type matches envelope');
    assert(row.source_system === 'engagegroovy', 'row source_system is set');
    assert(row.entity_type === 'risk_profile', 'row entity_type is set');
    assert(row.payload.event_type === 'risk.profile.generated', 'full event envelope is stored in payload');
    assert(row.status === 'pending', 'row status is pending');
  });

  await test('missing Supabase config is explicit', async () => {
    const result = await persistEvents(sampleEvents(), { supabase: null, dryRun: false });

    assert(result.ok === false, 'missing config does not pretend success');
    assert(result.mode === 'missing_config', 'missing config mode is reported');
    assert(result.errors[0].code === 'supabase_config_missing', 'structured missing config error is returned');
    assert(result.attempted_events === 4, 'all events are counted as attempted');
  });

  await test('successful mocked insert stores all events', async () => {
    const mock = createMockSupabase((rows) => ({
      data: rows.map((row, index) => ({ id: `event-${index + 1}`, ...row })),
      error: null
    }));

    const result = await persistEvents(sampleEvents(), { supabase: mock, dryRun: false });

    assert(result.ok === true, 'mock insert succeeds');
    assert(result.mode === 'supabase', 'supabase mode is reported');
    assert(result.stored_events.length === 4, 'four events are returned as stored');
    assert(mock.calls[0].table === 'events', 'events table is used');
    assert(mock.calls[1].rows[0].event_type === 'lead.captured', 'lead event is inserted first');
  });

  await test('failed mocked insert is visible and actionable', async () => {
    const mock = createMockSupabase(() => ({
      data: null,
      error: {
        code: '23502',
        message: 'null value in column "event_type" violates not-null constraint',
        details: 'Failing row contains a bad event.',
        hint: 'Check event mapping.'
      }
    }));

    const result = await persistEvents(sampleEvents(), { supabase: mock, dryRun: false });

    assert(result.ok === false, 'mock insert failure is reported');
    assert(result.mode === 'supabase', 'supabase mode is preserved on insert failure');
    assert(result.errors[0].code === '23502', 'database error code is returned');
    assert(result.errors[0].hint === 'Check event mapping.', 'database hint is returned');
  });

  await test('dry run validates without Supabase credentials', async () => {
    const result = await persistEvents(sampleEvents(), { supabase: null, dryRun: true });

    assert(result.ok === true, 'dry run succeeds without Supabase');
    assert(result.mode === 'dry_run', 'dry run mode is reported');
    assert(result.stored_events.length === 4, 'dry run returns all prepared rows');
    assert(result.stored_events[0].dry_run === true, 'dry run rows are clearly marked');
  });

  console.log('\n--- Event storage tests complete ---');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
