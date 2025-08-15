// CRM Hacker — Salesforce Pricing Calculator (vanilla JS build)
// Pricing catalog (USD). Update values here when Salesforce list prices change.
const PRICING = {
  editions: {
    starter: { key: "starter", name: "Starter Suite", price: 25, per: "user" },
    pro: { key: "pro", name: "Pro Suite", price: 100, per: "user" },
    enterprise: { key: "enterprise", name: "Enterprise", price: 175, per: "user" },
    unlimited: { key: "unlimited", name: "Unlimited", price: 350, per: "user" },
    agentforce1: { key: "agentforce1", name: "Agentforce 1 Sales", price: 550, per: "user" }
  },
  addons: {
    apiAddOn: { key: "apiAddOn", name: "Web Services API (Pro Suite)", price: 25, per: "user" },
    salesEngagement: { key: "salesEngagement", name: "Sales Engagement", price: 50, per: "user" },
    conversationIntelligence: { key: "conversationIntelligence", name: "Einstein Conversation Insights", price: 50, per: "user" },
    revenueIntelligence: { key: "revenueIntelligence", name: "Revenue Intelligence", price: 220, per: "user" },
    revenueCloud: { key: "revenueCloud", name: "Revenue Cloud (CPQ/Billing)", price: 200, per: "user" },
    maps: { key: "maps", name: "Salesforce Maps", price: 75, per: "user" },
    salesPrograms: { key: "salesPrograms", name: "Sales Programs", price: 100, per: "user" },
    emailsAlerts: { key: "emailsAlerts", name: "Sales Emails & Alerts", price: 50, per: "user" },
    prmLogins: { key: "prmLogins", name: "Partner Relationship Management", price: 10, per: "login" }
  },
  successPlans: {
    standard: { key: "standard", name: "Standard (included)", rate: 0 },
    premier: { key: "premier", name: "Premier (+30% of license)", rate: 0.3 },
    signature: { key: "signature", name: "Signature (contact sales)", rate: null }
  },
  implementation: {
    none: { key: "none", name: "No Implementation Package", fee: 0 },
    basic: { key: "basic", name: "Quick Start (CRM Hacker)", fee: 10000 },
    standard: { key: "standard", name: "Standard (CRM Hacker)", fee: 25000 },
    advanced: { key: "advanced", name: "Advanced (CRM Hacker)", fee: 50000 }
  }
};

// Elements
const $ = (id) => document.getElementById(id);

// State
const state = {
  firstName: "", lastName: "", company: "", email: "",
  users: 15, edition: "enterprise", successPlan: "standard", impl: "standard",
  addons: {
    apiAddOn: false,
    salesEngagement: true,
    conversationIntelligence: false,
    revenueIntelligence: true,
    revenueCloud: false,
    maps: false,
    salesPrograms: false,
    emailsAlerts: false,
    prmLogins: 0
  },
  signals: {
    teamSize: 15,
    quotingComplexity: 2,
    forecastingMaturity: 1,
    fieldSales: 0,
    outboundCadence: 1,
    needIntegrationsAPI: true,
    aiPriority: 1,
    budgetSensitivity: 1
  }
};

function currency(n) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function compute() {
  const editionPrice = PRICING.editions[state.edition].price;
  const perUserAddOns = [];
  if (state.addons.salesEngagement) perUserAddOns.push(PRICING.addons.salesEngagement);
  if (state.addons.conversationIntelligence) perUserAddOns.push(PRICING.addons.conversationIntelligence);
  if (state.addons.revenueIntelligence) perUserAddOns.push(PRICING.addons.revenueIntelligence);
  if (state.addons.revenueCloud) perUserAddOns.push(PRICING.addons.revenueCloud);
  if (state.addons.maps) perUserAddOns.push(PRICING.addons.maps);
  if (state.addons.salesPrograms) perUserAddOns.push(PRICING.addons.salesPrograms);
  if (state.addons.emailsAlerts) perUserAddOns.push(PRICING.addons.emailsAlerts);
  if (state.edition === "pro" && state.addons.apiAddOn) perUserAddOns.push(PRICING.addons.apiAddOn);

  const licenseMonthly = state.users * editionPrice;
  const addonsMonthly = perUserAddOns.reduce((sum, a) => sum + state.users * a.price, 0) + (state.addons.prmLogins || 0) * PRICING.addons.prmLogins.price;
  let successRate = PRICING.successPlans[state.successPlan].rate || 0;
  // Unlimited includes Premier (effective +0% even if selected)
  if (state.edition === "unlimited" && state.successPlan === "premier") successRate = 0;
  const successMonthly = (licenseMonthly + addonsMonthly) * successRate;

  const monthlyTotal = licenseMonthly + addonsMonthly + successMonthly;
  const annualTotal = monthlyTotal * 12;
  const oneTime = PRICING.implementation[state.impl].fee;
  return {
    licenseMonthly, addonsMonthly, successMonthly, monthlyTotal, annualTotal, oneTime
  };
}

// Recommendation engine (simple heuristics)
function recommend() {
  const s = state.signals;
  let nextEdition = state.edition;

  if (s.aiPriority === 2 && s.teamSize >= 25) nextEdition = "agentforce1";
  else if (s.quotingComplexity === 2 || s.needIntegrationsAPI) nextEdition = "enterprise";
  else if (s.teamSize <= 10 && s.budgetSensitivity === 2) nextEdition = "starter";
  else if (s.teamSize <= 20 && s.budgetSensitivity >= 1) nextEdition = "pro";
  else nextEdition = "enterprise";

  state.edition = nextEdition;
  $("edition").value = nextEdition;

  state.users = Number(s.teamSize);
  $("users").value = state.users;

  state.addons.salesEngagement = s.outboundCadence >= 1;
  $("a_salesEngagement").checked = state.addons.salesEngagement;

  state.addons.conversationIntelligence = s.outboundCadence === 2;
  $("a_conversationIntelligence").checked = state.addons.conversationIntelligence;

  state.addons.revenueIntelligence = s.forecastingMaturity >= 1;
  $("a_revenueIntelligence").checked = state.addons.revenueIntelligence;

  state.addons.revenueCloud = s.quotingComplexity === 2;
  $("a_revenueCloud").checked = state.addons.revenueCloud;

  state.addons.maps = s.fieldSales >= 1;
  $("a_maps").checked = state.addons.maps;

  state.addons.salesPrograms = s.outboundCadence >= 1 && s.teamSize >= 15;
  $("a_salesPrograms").checked = state.addons.salesPrograms;

  state.addons.apiAddOn = (state.edition === "pro" && s.needIntegrationsAPI);
  $("a_apiAddOn").checked = state.addons.apiAddOn;

  render();
}

function render() {
  // Toggle Pro API row
  $("proApiRow").style.display = state.edition === "pro" ? "flex" : "none";

  const out = compute();
  $("outEdition").textContent = PRICING.editions[state.edition].name;
  $("outUsers").textContent = state.users;
  $("outLicenses").textContent = currency(out.licenseMonthly);
  $("outAddons").textContent = currency(out.addonsMonthly);
  $("outSuccess").textContent = currency(out.successMonthly);
  $("outOneTime").textContent = currency(out.oneTime);
  $("outMonthly").textContent = currency(out.monthlyTotal);
  $("outAnnual").textContent = currency(out.annualTotal);

  const name = state.firstName ? `Hey ${state.firstName}` : "Hi there";
  const org = state.company || "your company";
  const email = state.email || "(add email)";
  $("personalizedLine").textContent = `${name}, here’s a ballpark for ${org}. We’ll email you a copy at ${email} if you hit copy.`;

  updateChart(out);
}

let chart;
function updateChart(out) {
  const ctx = $("breakdownChart").getContext("2d");
  const data = {
    labels: ["Licenses", "Add-ons", "Success Plan"],
    datasets: [{
      data: [Math.round(out.licenseMonthly), Math.round(out.addonsMonthly), Math.round(out.successMonthly)],
      backgroundColor: ["#10b981", "#0ea5e9", "#a78bfa"]
    }]
  };
  if (chart) {
    chart.data = data;
    chart.update();
  } else {
    chart = new Chart(ctx, {
      type: 'doughnut',
      data,
      options: { plugins: { legend: { position: 'bottom' } } }
    });
  }
}

function copySummary() {
  const out = compute();
  const addonsList = Object.entries(state.addons)
    .filter(([k,v]) => k !== "prmLogins" ? !!v : v > 0)
    .map(([k,v]) => k === "prmLogins" ? `${PRICING.addons.prmLogins.name} x ${v}` : PRICING.addons[k].name)
    .join(", ") || "None";

  const lines = [
    `${state.firstName ? state.firstName + "," : ""} Here’s your Salesforce estimate for ${state.company || "your company"}:`,
    `Edition: ${PRICING.editions[state.edition].name} (${currency(PRICING.editions[state.edition].price)}/user/mo)`,
    `Users: ${state.users}`,
    `Add-ons: ${addonsList}`,
    `Success Plan: ${PRICING.successPlans[state.successPlan].name}`,
    ``,
    `Monthly Total: ${currency(out.monthlyTotal)} (Licenses ${currency(out.licenseMonthly)} + Add-ons ${currency(out.addonsMonthly)} + Success ${currency(out.successMonthly)})`,
    `Annual Total: ${currency(out.annualTotal)}`,
    `One-time (Implementation): ${currency(out.oneTime)}`,
    ``,
    `Disclaimer: Estimates only. Salesforce bills annually; taxes/discounts not included.`
  ].join("\n");

  navigator.clipboard.writeText(lines).catch(()=>{});
}

// Wire inputs
function initBindings() {
  // Identity
  ["firstName","lastName","company","email"].forEach(id => {
    $(id).addEventListener("input", e => { state[id] = e.target.value; render(); });
  });

  // Core
  $("users").addEventListener("input", e => { state.users = Math.max(1, Number(e.target.value||1)); render(); });
  $("edition").addEventListener("change", e => { state.edition = e.target.value; render(); });
  $("successPlan").addEventListener("change", e => { state.successPlan = e.target.value; render(); });

  // Addons
  const addonIds = ["salesEngagement","conversationIntelligence","revenueIntelligence","revenueCloud","maps","salesPrograms","emailsAlerts","apiAddOn"];
  addonIds.forEach(key => {
    const el = $("a_"+key);
    if (el) el.addEventListener("change", e => { state.addons[key] = e.target.checked; render(); });
  });
  $("prmLogins").addEventListener("input", e => { state.addons.prmLogins = Math.max(0, Number(e.target.value||0)); render(); });

  // Impl
  $("impl").addEventListener("change", e => { state.impl = e.target.value; render(); });

  // Signals
  ["teamSize","quotingComplexity","forecastingMaturity","fieldSales","outboundCadence","aiPriority","budgetSensitivity"].forEach(id => {
    $(id).addEventListener("input", e => { state.signals[id] = Number(e.target.value||0); });
  });
  $("needIntegrationsAPI").addEventListener("change", e => { state.signals.needIntegrationsAPI = e.target.checked; });

  $("recommendBtn").addEventListener("click", recommend);
  $("copyBtn").addEventListener("click", copySummary);
}

document.addEventListener("DOMContentLoaded", () => {
  initBindings();
  render();
});
