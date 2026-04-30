const crypto = require('crypto');

const PROFILE_ORDER = [
  'uncontrolled_ai_usage',
  'false_automation',
  'ai_in_wrong_place'
];

const SIGNAL_WEIGHTS = {
  ai_usage: {
    none_or_exploring: { uncontrolled_ai_usage: 0, false_automation: 0, ai_in_wrong_place: 4 },
    individual_tools: { uncontrolled_ai_usage: 18, false_automation: 4, ai_in_wrong_place: 8 },
    team_workflows: { uncontrolled_ai_usage: 14, false_automation: 12, ai_in_wrong_place: 10 },
    customer_or_revenue_work: { uncontrolled_ai_usage: 18, false_automation: 16, ai_in_wrong_place: 18 }
  },
  review_before_use: {
    always_reviewed: { uncontrolled_ai_usage: 0, false_automation: 2, ai_in_wrong_place: 2 },
    spot_checked: { uncontrolled_ai_usage: 14, false_automation: 8, ai_in_wrong_place: 6 },
    rarely_reviewed: { uncontrolled_ai_usage: 24, false_automation: 12, ai_in_wrong_place: 8 },
    no_owner: { uncontrolled_ai_usage: 28, false_automation: 10, ai_in_wrong_place: 10 }
  },
  output_process_impact: {
    internal_reference: { uncontrolled_ai_usage: 4, false_automation: 2, ai_in_wrong_place: 6 },
    shapes_work: { uncontrolled_ai_usage: 8, false_automation: 8, ai_in_wrong_place: 12 },
    changes_customer_or_sales_output: { uncontrolled_ai_usage: 12, false_automation: 12, ai_in_wrong_place: 22 },
    triggers_decisions_or_actions: { uncontrolled_ai_usage: 14, false_automation: 18, ai_in_wrong_place: 24 }
  },
  process_structure: {
    documented_owner_and_steps: { uncontrolled_ai_usage: 0, false_automation: 0, ai_in_wrong_place: 2 },
    known_but_informal: { uncontrolled_ai_usage: 8, false_automation: 6, ai_in_wrong_place: 8 },
    varies_by_person: { uncontrolled_ai_usage: 12, false_automation: 14, ai_in_wrong_place: 12 },
    unclear_or_missing: { uncontrolled_ai_usage: 16, false_automation: 22, ai_in_wrong_place: 16 }
  },
  manual_handoffs: {
    few_and_clear: { uncontrolled_ai_usage: 2, false_automation: 0, ai_in_wrong_place: 2 },
    several_manual_steps: { uncontrolled_ai_usage: 6, false_automation: 10, ai_in_wrong_place: 8 },
    frequent_copy_paste: { uncontrolled_ai_usage: 8, false_automation: 20, ai_in_wrong_place: 10 },
    hidden_rework_or_duplicate_entry: { uncontrolled_ai_usage: 10, false_automation: 24, ai_in_wrong_place: 12 }
  },
  tooling_dependency: {
    low_dependency: { uncontrolled_ai_usage: 2, false_automation: 2, ai_in_wrong_place: 2 },
    one_ai_tool: { uncontrolled_ai_usage: 8, false_automation: 4, ai_in_wrong_place: 6 },
    multiple_unconnected_tools: { uncontrolled_ai_usage: 14, false_automation: 18, ai_in_wrong_place: 12 },
    ai_embedded_in_core_system: { uncontrolled_ai_usage: 16, false_automation: 16, ai_in_wrong_place: 22 }
  }
};

const PROFILE_RECOMMENDATIONS = {
  uncontrolled_ai_usage: {
    priority: 'high',
    recommended_pipeline: 'ai_usage_control_review',
    control: 'Name the owner, review point, and allowed AI use before outputs reach customers or revenue workflows.'
  },
  false_automation: {
    priority: 'medium',
    recommended_pipeline: 'automation_reality_check',
    control: 'Separate true automation from manual handoffs, copy-paste work, and hidden rework before scaling the workflow.'
  },
  ai_in_wrong_place: {
    priority: 'high',
    recommended_pipeline: 'ai_placement_control_sprint',
    control: 'Move AI away from high-impact decision points until the process, review gate, and failure handling are explicit.'
  }
};

function nowIso() {
  return new Date().toISOString();
}

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return crypto.createHash('sha256').update(String(Date.now()) + Math.random()).digest('hex').slice(0, 32);
}

function clean(value) {
  return String(value || '').trim();
}

function normalizeLead(input) {
  return {
    name: clean(input.name),
    email: clean(input.email).toLowerCase(),
    company: clean(input.company),
    website: clean(input.website),
    ai_usage: clean(input.ai_usage),
    review_before_use: clean(input.review_before_use),
    output_process_impact: clean(input.output_process_impact),
    process_structure: clean(input.process_structure),
    manual_handoffs: clean(input.manual_handoffs),
    tooling_dependency: clean(input.tooling_dependency),
    notes: clean(input.notes),
    source: clean(input.source) || 'risk-map'
  };
}

function addSignalScores(scores, signalName, signalValue) {
  const weights = SIGNAL_WEIGHTS[signalName] && SIGNAL_WEIGHTS[signalName][signalValue];
  if (!weights) return null;

  PROFILE_ORDER.forEach((profile) => {
    scores[profile] += weights[profile] || 0;
  });

  return {
    name: signalName,
    value: signalValue,
    weights
  };
}

function classifyProfile(scores) {
  return PROFILE_ORDER.slice().sort((a, b) => {
    if (scores[b] !== scores[a]) return scores[b] - scores[a];
    return PROFILE_ORDER.indexOf(a) - PROFILE_ORDER.indexOf(b);
  })[0];
}

function collectControlGaps(lead) {
  const gaps = [];
  if (['rarely_reviewed', 'no_owner'].includes(lead.review_before_use)) {
    gaps.push('review_before_use');
  }
  if (['varies_by_person', 'unclear_or_missing'].includes(lead.process_structure)) {
    gaps.push('process_structure');
  }
  if (['frequent_copy_paste', 'hidden_rework_or_duplicate_entry'].includes(lead.manual_handoffs)) {
    gaps.push('manual_handoffs');
  }
  if (['multiple_unconnected_tools', 'ai_embedded_in_core_system'].includes(lead.tooling_dependency)) {
    gaps.push('tooling_dependency');
  }
  return gaps;
}

function createEvent(eventType, payload, occurredAt) {
  return {
    event_type: eventType,
    schema: `${eventType}.v1`,
    domain: 'engagegroovy',
    occurred_at: occurredAt,
    payload
  };
}

function generateRiskProfile(lead) {
  const scores = {
    uncontrolled_ai_usage: 0,
    false_automation: 0,
    ai_in_wrong_place: 0
  };

  const signals = [
    addSignalScores(scores, 'ai_usage', lead.ai_usage),
    addSignalScores(scores, 'review_before_use', lead.review_before_use),
    addSignalScores(scores, 'output_process_impact', lead.output_process_impact),
    addSignalScores(scores, 'process_structure', lead.process_structure),
    addSignalScores(scores, 'manual_handoffs', lead.manual_handoffs),
    addSignalScores(scores, 'tooling_dependency', lead.tooling_dependency)
  ].filter(Boolean);

  const riskProfile = classifyProfile(scores);
  const recommendation = PROFILE_RECOMMENDATIONS[riskProfile];
  const riskScore = Math.min(100, scores[riskProfile]);
  const controlGaps = collectControlGaps(lead);

  return {
    lead_email: lead.email,
    company: lead.company,
    risk_profile: riskProfile,
    risk_score: riskScore,
    signals,
    signal_scores: scores,
    control_gaps: controlGaps,
    recommended_pipeline: recommendation.recommended_pipeline,
    priority: recommendation.priority,
    next_action: 'ceo_review',
    control_required: recommendation.control
  };
}

function recommendPipeline(riskProfile) {
  return {
    lead_email: riskProfile.lead_email,
    company: riskProfile.company,
    risk_profile: riskProfile.risk_profile,
    risk_score: riskProfile.risk_score,
    signals: riskProfile.signals,
    control_gaps: riskProfile.control_gaps,
    priority: riskProfile.priority,
    recommended_pipeline: riskProfile.recommended_pipeline,
    next_action: 'ceo_review',
    control: riskProfile.control_required
  };
}

function preparePaperclipIssue(lead, riskProfile, pipeline, occurredAt) {
  const id = uuid();
  return {
    id,
    title: `CEO review: ${lead.company || lead.email} AI risk map`,
    description: [
      `Risk profile: ${riskProfile.risk_profile}`,
      `Risk score: ${riskProfile.risk_score}`,
      `Recommended pipeline: ${pipeline.recommended_pipeline}`,
      `Control gaps: ${riskProfile.control_gaps.length ? riskProfile.control_gaps.join(', ') : 'none flagged'}`,
      `Next action: ${pipeline.next_action}`,
      lead.notes ? `Visitor notes: ${lead.notes}` : ''
    ].filter(Boolean).join('\n'),
    domain: 'engagegroovy',
    event_type: 'paperclip.issue.prepared',
    schema: 'issue.v1',
    routing_path: 'lead.captured -> risk.profile.generated -> pipeline.recommended -> CEO',
    priority: pipeline.priority,
    status: 'pending',
    assignee: 'CEO',
    created_at: occurredAt,
    updated_at: occurredAt,
    attachments: [],
    comments: [
      {
        id: `risk-${id}`,
        author: 'engagegroovy-risk-map',
        text: 'Prepared from the AI risk-map wizard for CEO review.',
        created_at: occurredAt
      }
    ],
    lead,
    risk_profile: riskProfile,
    pipeline
  };
}

function buildRiskMapFlow(input, options = {}) {
  const occurredAt = options.occurredAt || nowIso();
  const lead = normalizeLead(input || {});
  const leadId = options.leadId || uuid();

  const leadPayload = {
    id: leadId,
    ...lead,
    captured_at: occurredAt
  };

  const riskProfile = generateRiskProfile(lead);
  const pipeline = recommendPipeline(riskProfile);
  const issue = preparePaperclipIssue(lead, riskProfile, pipeline, occurredAt);

  return {
    lead: leadPayload,
    risk_profile: riskProfile,
    pipeline,
    paperclip_issue: issue,
    events: [
      createEvent('lead.captured', leadPayload, occurredAt),
      createEvent('risk.profile.generated', riskProfile, occurredAt),
      createEvent('pipeline.recommended', pipeline, occurredAt),
      createEvent('paperclip.issue.prepared', issue, occurredAt)
    ]
  };
}

module.exports = {
  buildRiskMapFlow,
  generateRiskProfile,
  recommendPipeline,
  preparePaperclipIssue
};
