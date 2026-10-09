import { D as e, _ as t, a as n, g as r, l as i, m as a, o, r as s, u as c, y as l } from "./training-BicQG7jj.js";
var u = {
	schema: 1,
	version: "fitness-reference-v2",
	checkedOn: "2026-10-09",
	contentPolicy: "Original short summaries and bibliographic facts. Linked works retain their own rights. No copied papers, paid programs, personal records, training examples or fine-tuning dataset are included.",
	notes: [
		{
			id: "adult-consistency",
			evidenceId: "ACSM-2026",
			title: "ACSM 2026 resistance training guidance",
			url: "https://acsm.org/resistance-training-guidelines-update-2026/",
			doi: "10.1249/MSS.0000000000003897",
			audiences: ["adult"],
			population: "Healthy adults; an overview of resistance-training reviews.",
			keywords: [
				"consistency",
				"progressive resistance",
				"regular practice",
				"bodyweight",
				"elastic bands"
			],
			summary: "Regular resistance training benefits healthy adults. Programs can use weights, bands or bodyweight. Strength, muscle growth and power have different priorities; training to failure is not a universal requirement.",
			limits: "This guidance does not validate an app's exact progression thresholds, assess technique or establish readiness after a symptom. Youth and clinical prescriptions need separate guidance.",
			review: {
				status: "official-summary-and-abstract",
				checkedOn: "2026-10-08",
				note: "Official ACSM interpretation and position-stand abstract reviewed; not a complete trial-by-trial audit."
			},
			rights: {
				content: "original-summary",
				sourceTextRedistributed: !1
			},
			enabled: !0
		},
		{
			id: "hypertrophy-frequency",
			evidenceId: "SCHOENFELD-2019-FREQ",
			title: "Schoenfeld, Grgic and Krieger 2019 training frequency",
			url: "https://pubmed.ncbi.nlm.nih.gov/30558493/",
			doi: "10.1080/02640414.2018.1555906",
			audiences: ["adult"],
			population: "Adults in 25 resistance-training studies with muscle-growth outcomes.",
			keywords: [
				"frequency",
				"times per week",
				"split routine",
				"volume equated",
				"same weekly work"
			],
			summary: "When weekly volume was matched, higher training frequency did not meaningfully improve muscle growth in this review. Frequency can help distribute weekly work across a manageable schedule.",
			limits: "This finding concerns hypertrophy, not every strength or sport outcome. It does not prove that one schedule suits everyone or that recovery is unnecessary.",
			review: {
				status: "abstract-reviewed",
				checkedOn: "2026-10-08",
				note: "Abstract checked during U04b; later retrieval returned an incomplete page. Full paper not reviewed."
			},
			rights: {
				content: "original-summary",
				sourceTextRedistributed: !1
			},
			enabled: !0
		},
		{
			id: "weekly-dose",
			evidenceId: "PELLAND-2026-DOSE",
			title: "Pelland and colleagues 2026 weekly volume and frequency",
			url: "https://link.springer.com/article/10.1007/s40279-025-02344-w",
			doi: "10.1007/s40279-025-02344-w",
			audiences: ["adult"],
			population: "67 studies; participants were predominantly young men.",
			keywords: [
				"weekly sets",
				"volume",
				"dose response",
				"diminishing returns",
				"indirect sets"
			],
			summary: "Higher weekly volume was associated with greater strength and muscle gains, with diminishing returns. Fractional accounting of indirect work fit these analyses better than counting every indirect set fully or ignoring it.",
			limits: "These group-level models do not identify an individual's best set count, justify unlimited volume, or validate the app's particular muscle weights. Abstract review only.",
			review: {
				status: "abstract-reviewed",
				checkedOn: "2026-10-08",
				note: "Publisher abstract reviewed; subscription full text not accessed."
			},
			rights: {
				content: "original-summary",
				sourceTextRedistributed: !1
			},
			enabled: !0
		},
		{
			id: "failure-context",
			evidenceId: "ROBINSON-2024-RIR",
			title: "Robinson and colleagues 2024 proximity to failure",
			url: "https://pubmed.ncbi.nlm.nih.gov/38970765/",
			doi: "10.1007/s40279-024-02069-2",
			audiences: ["adult"],
			population: "Resistance-training studies analyzed using estimated repetitions in reserve.",
			keywords: [
				"rir",
				"reps left",
				"repetitions in reserve",
				"failure",
				"effort"
			],
			summary: "Muscle growth was associated with sets ending closer to failure, while strength gains showed little relationship to estimated repetitions in reserve in these analyses.",
			limits: "The analyses were exploratory, used estimated RIR and had modest fit. They do not establish an exact ideal RIR or require every set to reach failure. RIR cannot establish medical readiness.",
			review: {
				status: "abstract-reviewed",
				checkedOn: "2026-10-08",
				note: "PubMed abstract reviewed; full paper not reviewed."
			},
			rights: {
				content: "original-summary",
				sourceTextRedistributed: !1
			},
			enabled: !0
		},
		{
			id: "short-sessions",
			evidenceId: "IVERSEN-2021-TIME",
			title: "Iversen and colleagues 2021 time-efficient training",
			url: "https://link.springer.com/article/10.1007/s40279-021-01490-1",
			doi: "10.1007/s40279-021-01490-1",
			audiences: ["adult"],
			population: "Narrative review for time-limited adults; much of the cited research used untrained or recreationally active participants.",
			keywords: [
				"limited time",
				"short sessions",
				"time efficient",
				"push pull",
				"time budget"
			],
			summary: "When time is limited, this review prioritizes major lower-body, pushing and pulling movements. Lower-volume training can be useful, while maximizing gains may require more work and time.",
			limits: "A narrative synthesis does not validate these app templates or guarantee the same results from a brief starter and a longer program. Do not remove necessary rest or technique practice to fit a timer.",
			review: {
				status: "abstract-and-selected-sections",
				checkedOn: "2026-10-08",
				note: "Publisher abstract, scope and rights sections reviewed; not every cited trial."
			},
			rights: {
				content: "original-summary",
				sourceTextRedistributed: !1,
				sourceLicense: "CC-BY-4.0",
				licenseUrl: "https://creativecommons.org/licenses/by/4.0/"
			},
			enabled: !0
		},
		{
			id: "concurrent-training",
			evidenceId: "CONCURRENT",
			title: "Schumann and colleagues 2022 concurrent training",
			url: "https://pubmed.ncbi.nlm.nih.gov/34757594/",
			doi: "10.1007/s40279-021-01587-7",
			audiences: ["adult"],
			population: "Healthy adults in 43 studies of supervised concurrent aerobic and resistance training.",
			keywords: [
				"concurrent",
				"aerobic and strength",
				"explosive strength",
				"interference",
				"hybrid"
			],
			summary: "Combining aerobic and strength training generally retained maximal-strength and muscle-size gains. Explosive-strength gains could be reduced, particularly when both modes occurred in one session.",
			limits: "The results are not a guarantee for every athlete, workload or event. They do not prove that the app's hybrid schedule optimizes sport performance.",
			review: {
				status: "abstract-reviewed",
				checkedOn: "2026-10-08",
				note: "PubMed abstract reviewed; full paper not reviewed in this milestone."
			},
			rights: {
				content: "original-summary",
				sourceTextRedistributed: !1
			},
			enabled: !0
		},
		{
			id: "youth-supervision",
			evidenceId: "AAP-2020",
			title: "AAP 2020 youth resistance-training guidance",
			url: "https://www.healthychildren.org/English/news/Pages/Guidance-on-Resistance-Training-for-Children.aspx",
			doi: "10.1542/peds.2020-1011",
			audiences: ["youth"],
			population: "Children and adolescents; developmentally appropriate training.",
			keywords: [
				"youth",
				"children",
				"adolescent",
				"supervision",
				"technique",
				"training age"
			],
			summary: "Youth resistance training requires appropriate technique and supervision. Experience and demonstrated competence matter alongside chronological age; a completed log cannot show whether technique was sound.",
			limits: "The official AAP summary was reviewed because the journal page failed retrieval. This note cannot replace qualified supervision or authorize automatic youth load progression.",
			review: {
				status: "official-summary",
				checkedOn: "2026-10-08",
				note: "AAP HealthyChildren summary reviewed; journal page unavailable this pass."
			},
			rights: {
				content: "original-summary",
				sourceTextRedistributed: !1
			},
			enabled: !0
		},
		{
			id: "run-walk",
			evidenceId: "NHS-C25K",
			title: "NHS Couch to 5K running plan",
			url: "https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan/",
			audiences: ["adult"],
			population: "A public beginner run/walk schedule; not a trial of Movefield's templates.",
			keywords: [
				"run walk",
				"couch to 5k",
				"beginner running",
				"rest days",
				"30 minutes"
			],
			summary: "The NHS sequence uses three weekly runs over nine weeks, with a rest day between runs. Its final running target is thirty minutes; the title does not guarantee a particular distance.",
			limits: "The app's other run/walk and hybrid templates are not automatically the NHS sequence. A past log does not justify faster stages, catch-up distance or training through symptoms.",
			review: {
				status: "official-schedule",
				checkedOn: "2026-10-08",
				note: "Official current schedule and final-week target reviewed."
			},
			rights: {
				content: "original-summary",
				sourceTextRedistributed: !1
			},
			enabled: !0
		},
		{
			id: "adult-activity",
			evidenceId: "WHO-2020",
			title: "WHO adult physical-activity guidance",
			url: "https://www.who.int/europe/news-room/fact-sheets/item/physical-activity",
			audiences: ["adult"],
			population: "This note summarizes adult health guidance; older adults need additional balance and functional work.",
			keywords: [
				"health activity",
				"aerobic activity",
				"physical activity",
				"whole week",
				"health guidelines"
			],
			summary: "Adult health guidance combines aerobic activity with muscle-strengthening activity. A resistance-only workout or brief movement starter may cover only part of the recommended weekly activity.",
			limits: "A single workout cannot establish compliance with a whole week's guidance. This short note does not cover youth, pregnancy, disability adaptations or an individual's clinical needs.",
			review: {
				status: "official-guidance",
				checkedOn: "2026-10-08",
				note: "WHO current age-group summary reviewed; only adult scope summarized here."
			},
			rights: {
				content: "original-summary",
				sourceTextRedistributed: !1
			},
			enabled: !0
		},
		{
			id: "repetition-progression-pending",
			evidenceId: "REP-PROGRESSION",
			title: "Plotkin and colleagues 2022 load or repetition progression",
			url: "https://peerj.com/articles/14142/",
			doi: "10.7717/peerj.14142",
			audiences: ["adult"],
			population: "Population details await successful primary-text review.",
			keywords: [
				"repetition progression",
				"fixed load",
				"progressive overload"
			],
			summary: "",
			limits: "Do not use this entry to assert indefinite progress at fixed load or equivalence across all populations and outcomes.",
			review: {
				status: "bibliography-only",
				checkedOn: "2026-10-08",
				note: "Publisher returned 403; PubMed returned an incomplete page and PMC a browser-check page. No safeguard bypassed. Disabled until usable primary content is reviewed."
			},
			rights: {
				content: "bibliographic-facts-only",
				sourceTextRedistributed: !1
			},
			enabled: !1
		},
		{
			id: "load-goal",
			evidenceId: "CURRIER-2023",
			title: "Currier and colleagues 2023 resistance-training prescriptions",
			url: "https://pubmed.ncbi.nlm.nih.gov/37414459/",
			doi: "10.1136/bjsports-2023-106807",
			audiences: ["adult"],
			population: "Healthy adults: strength network 178 studies and 5,097 participants; hypertrophy network 119 studies and 3,364 participants.",
			keywords: [
				"heavy loads",
				"one repetition maximum",
				"multiset",
				"load specificity"
			],
			summary: "All studied resistance-training prescriptions improved strength and muscle size compared with no exercise. Higher loads favored maximal-strength outcomes; multiple sets featured in the highest-ranked muscle-growth prescriptions.",
			limits: "Network rankings compare groups and include indirect comparisons. They do not require a novice to test a maximum, prove one app plan is best, or establish an individual starting load.",
			enabled: !0,
			review: {
				status: "abstract-reviewed",
				checkedOn: "2026-10-09",
				note: "Primary bibliographic record and abstract reviewed via PubMed/Europe PMC; not a full-text or trial-by-trial critical appraisal."
			},
			rights: {
				content: "original-summary",
				sourceTextRedistributed: !1
			}
		},
		{
			id: "rest-intervals",
			evidenceId: "SINGER-2024-REST",
			title: "Singer and colleagues 2024 rest-interval review",
			url: "https://pubmed.ncbi.nlm.nih.gov/39205815/",
			doi: "10.3389/fspor.2024.1429789",
			audiences: ["adult"],
			population: "Nine randomized studies in healthy adults, with 19 muscle-size measurements.",
			keywords: [
				"rest intervals",
				"inter-set",
				"short rest",
				"longer rest"
			],
			summary: "The analysis suggested a small muscle-growth advantage for rests longer than sixty seconds, with substantial uncertainty and overlapping estimates. It did not detect appreciable added hypertrophy differences beyond ninety seconds.",
			limits: "This is not a universal rest cap. Heavy strength work, breathlessness, technique and preserving repetitions may require more rest. The analysis does not justify rushing sets to fit a timer.",
			enabled: !0,
			review: {
				status: "abstract-reviewed",
				checkedOn: "2026-10-09",
				note: "Primary bibliographic record and abstract reviewed via PubMed/Europe PMC; not a full-text or trial-by-trial critical appraisal."
			},
			rights: {
				content: "original-summary",
				sourceTextRedistributed: !1
			}
		},
		{
			id: "superset-tradeoffs",
			evidenceId: "ZHANG-2025-SUPERSET",
			title: "Zhang and colleagues 2025 superset review",
			url: "https://pubmed.ncbi.nlm.nih.gov/39903375/",
			doi: "10.1007/s40279-025-02176-8",
			audiences: ["adult"],
			population: "Nineteen studies involving 313 participants; pooled acute and chronic outcomes.",
			keywords: [
				"supersets",
				"paired exercises",
				"agonist antagonist",
				"time efficiency"
			],
			summary: "Supersets shortened sessions and generally produced similar pooled strength and muscle-growth outcomes, while perceived effort increased. Pairing opposing muscle groups preserved work better than pairing similar movements.",
			limits: "The chronic evidence is limited and not every pairing is equivalent. No automatic superset conversion is implied; preserve equipment access, technique and recovery, especially for demanding lifts.",
			enabled: !0,
			review: {
				status: "abstract-reviewed",
				checkedOn: "2026-10-09",
				note: "Primary bibliographic record and abstract reviewed via PubMed/Europe PMC; not a full-text or trial-by-trial critical appraisal."
			},
			rights: {
				content: "original-summary",
				sourceTextRedistributed: !1
			}
		},
		{
			id: "regional-length",
			evidenceId: "VAROVIC-2025-LENGTH",
			title: "Varovic and colleagues 2025 muscle-length and regional-growth review",
			url: "https://pubmed.ncbi.nlm.nih.gov/40570881/",
			doi: "10.1055/a-2615-4935",
			audiences: ["adult"],
			population: "Twelve studies in young adults; regional muscle-growth measures.",
			keywords: [
				"muscle length",
				"regional hypertrophy",
				"stretched position"
			],
			summary: "Longer and shorter average muscle-length conditions produced broadly similar pooled regional growth, with small estimated differences. The modest separation between compared muscle lengths limits interpretation.",
			limits: "This does not settle all exercise choices or prove that stretching farther is better. It does not assess painful ranges, injury rehabilitation, every muscle, or an individual technique.",
			enabled: !0,
			review: {
				status: "abstract-reviewed",
				checkedOn: "2026-10-09",
				note: "Primary bibliographic record and abstract reviewed via PubMed/Europe PMC; not a full-text or trial-by-trial critical appraisal."
			},
			rights: {
				content: "original-summary",
				sourceTextRedistributed: !1
			}
		},
		{
			id: "lengthened-partials",
			evidenceId: "WOLF-2025-PARTIAL",
			title: "2025 lengthened-partial and full-range trial",
			url: "https://pubmed.ncbi.nlm.nih.gov/39959841/",
			doi: "10.7717/peerj.18904",
			audiences: ["adult"],
			population: "Thirty healthy resistance-trained participants; eight-week within-person upper-body comparison.",
			keywords: [
				"lengthened partials",
				"full range",
				"range of motion"
			],
			summary: "Lengthened partial and full-range repetitions produced similar elbow-muscle thickness and lat-pulldown strength-endurance changes in this trial. Both conditions included work in the lengthened position.",
			limits: "The result is specific to this small, short upper-body trial. It does not validate all shortened-range movements, lower-body prescriptions, rehabilitation, or automatic changes to accepted exercise technique.",
			enabled: !0,
			review: {
				status: "abstract-reviewed",
				checkedOn: "2026-10-09",
				note: "Primary bibliographic record and abstract reviewed via PubMed/Europe PMC; not a full-text or trial-by-trial critical appraisal."
			},
			rights: {
				content: "original-summary",
				sourceTextRedistributed: !1
			}
		},
		{
			id: "periodization-context",
			evidenceId: "MOESGAARD-2022-PERIOD",
			title: "Moesgaard and colleagues 2022 volume-matched periodization",
			url: "https://pubmed.ncbi.nlm.nih.gov/35044672/",
			doi: "10.1007/s40279-021-01636-1",
			audiences: ["adult"],
			population: "Thirty-five resistance-training studies comparing volume-matched periodization models.",
			keywords: [
				"periodization",
				"undulating",
				"linear periodization"
			],
			summary: "Periodized training favored maximal strength over non-periodized training, without a clear muscle-growth difference. Undulating models favored strength mainly among trained participants in subgroup analyses.",
			limits: "These small pooled differences do not mean that complexity is required for beginners or that one named routine is superior. The 2026 linear-versus-undulating synthesis reports similar pooled athletic outcomes; populations and outcomes differ.",
			enabled: !0,
			review: {
				status: "abstract-reviewed",
				checkedOn: "2026-10-09",
				note: "Primary bibliographic record and abstract reviewed via PubMed/Europe PMC; not a full-text or trial-by-trial critical appraisal."
			},
			rights: {
				content: "original-summary",
				sourceTextRedistributed: !1
			}
		},
		{
			id: "women-response",
			evidenceId: "MOLINARI-2024-WOMEN",
			title: "Molinari and colleagues 2024 training in healthy young women",
			url: "https://pubmed.ncbi.nlm.nih.gov/38090747/",
			doi: "10.1519/jsc.0000000000004666",
			audiences: ["adult"],
			population: "Forty articles involving 1,312 healthy women aged eighteen to thirty-five.",
			keywords: [
				"women",
				"female",
				"healthy young women"
			],
			summary: "Resistance training improved strength and muscle-size outcomes in healthy young women. The review associated more training sessions with muscle-size changes; prescription moderators do not establish an individual optimum.",
			limits: "The search ended in May 2022. Findings do not set sex-specific starting loads, justify automatic workload increases, or cover pregnancy, older women and clinical populations.",
			enabled: !0,
			review: {
				status: "abstract-reviewed",
				checkedOn: "2026-10-09",
				note: "Primary bibliographic record and abstract reviewed via PubMed/Europe PMC; not a full-text or trial-by-trial critical appraisal."
			},
			rights: {
				content: "original-summary",
				sourceTextRedistributed: !1
			}
		}
	]
};
i({
	workoutId: c().max(150),
	policy: o("workout-review-v1"),
	status: n([
		"reviewed",
		"limited_data",
		"needs_review"
	]),
	summary: c().min(1).max(700),
	observations: s(i({
		factId: c().max(100),
		explanation: c().min(1).max(500)
	}).strict()).min(1).max(6),
	proposalIds: s(c().max(150)).max(5),
	evidenceIds: s(c().max(100)).max(5)
}).strict();
//#endregion
//#region lib/fitness-grounding.ts
var d = u.version;
u.notes, i({
	policy: o("workout-evidence-selection-v1"),
	corpusVersion: o(d),
	requestId: c().min(8).max(100),
	workoutId: c().min(1).max(150),
	noteIds: s(c().min(1).max(100)).max(2)
}).strict();
//#endregion
//#region lib/qwen-runtime-contract.ts
var f = 2048;
function p(e) {
	return Number.isSafeInteger(e) && e > 0 && e + 256 <= 2048;
}
function m(e, t, n) {
	let r = new Map(t.map((t) => [new URL(t, e).href, t]));
	return async (e, t) => {
		let i = typeof e == "string" ? e : e instanceof URL ? e.href : e.url;
		if ((t?.method || (e instanceof Request ? e.method : "GET")) !== "GET" || t?.body != null || e instanceof Request && e.body || (t?.signal || (e instanceof Request ? e.signal : void 0))?.aborted) throw Error("Runtime request refused.");
		let a = r.get(i);
		if (!a) throw Error("Runtime file outside verified cache.");
		let o = await n(a);
		return new Response(o, {
			status: 200,
			headers: { "Content-Type": a.endsWith(".wasm") ? "application/wasm" : a.endsWith(".json") ? "application/json" : "application/octet-stream" }
		});
	};
}
function h(e, t, n) {
	let r = t.map((t) => new URL(t, e).href), i = new Set(r), a = async (e) => {
		let t = typeof e == "string" ? e : e instanceof URL ? e.href : e.url;
		return i.has(t) ? n(e) : void 0;
	}, o = async () => {
		throw Error("Runtime cache writes refused.");
	}, s = {
		match: a,
		matchAll: async (e) => {
			let t = e && await a(e);
			return t ? [t] : [];
		},
		add: o,
		addAll: o,
		put: o,
		delete: async () => !1,
		keys: async () => r.map((e) => new Request(e))
	};
	return {
		open: async () => s,
		match: a,
		has: async () => !0,
		delete: async () => !1,
		keys: async () => []
	};
}
//#endregion
//#region lib/qwen-tokenizer.ts
async function g(t) {
	let n = await import("./lib-BQHvV-JG.js").then((t) => /* @__PURE__ */ e(t.t(), 1)), r = n.Tokenizer || n.default?.Tokenizer || globalThis.tokenizers?.Tokenizer;
	if (!r) throw Error("The model tokenizer could not open.");
	return r.fromJSON(t);
}
//#endregion
//#region lib/qwen-runtime.worker.ts
var _ = self, v = null, y = null, b = !1, x = r.find((e) => e.id === a), S = t({
	indexedDB,
	keyRange: IDBKeyRange,
	locks: navigator.locks,
	random: (e) => crypto.getRandomValues(new Uint8Array(e)),
	estimate: () => navigator.storage?.estimate() ?? Promise.resolve({})
}), C = l({
	models: [x],
	store: S,
	fetchAsset: async () => {
		throw Error("Runtime cannot download files.");
	}
}), w = new AbortController().signal, T = (e, t, n = {}) => _.postMessage({
	id: e,
	kind: t,
	...n
});
async function E(e) {
	if (v && y) {
		T(e, "ready", { loadMs: 0 });
		return;
	}
	let t = performance.now(), n = `https://movefield.invalid/${crypto.randomUUID()}/`;
	Object.defineProperty(self, "XMLHttpRequest", {
		value: class {
			constructor() {
				throw Error("Runtime transport refused.");
			}
		},
		configurable: !0
	}), await C.withCachedModel(x.id, w, async (t) => {
		let r = async (e) => {
			let n = x.assets.find((t) => t.path === e);
			if (!n || n.bytes > 83886080) throw Error("Runtime file limit.");
			let r = new Uint8Array(n.bytes), i = 0;
			for await (let n of t(e)) r.set(n, i), i += n.length;
			if (i !== n.bytes) throw Error("Incomplete runtime file.");
			return r.buffer;
		};
		_.fetch = m(n, x.assets.map((e) => e.path), r), Object.defineProperty(self, "caches", {
			value: h(n, x.assets.map((e) => e.path), _.fetch),
			configurable: !0
		});
		let [{ MLCEngine: i }, a] = await Promise.all([import("./lib-2aWPZDmS.js").then((e) => e.n), r("tokenizer.json").then(g)]);
		y = a, v = new i({
			logLevel: "SILENT",
			appConfig: { model_list: [{
				model_id: x.modelId,
				model: n,
				model_lib: new URL(x.assets.find((e) => e.path.endsWith(".wasm")).path, n).href,
				required_features: x.requiredFeatures
			}] },
			initProgressCallback: (t) => T(e, "progress", { progress: Math.max(0, Math.min(1, t.progress)) })
		}), await v.reload(x.modelId, {
			context_window_size: f,
			sliding_window_size: -1
		});
	}), _.fetch = async () => {
		throw Error("Runtime transport refused.");
	}, T(e, "ready", { loadMs: Math.round(performance.now() - t) });
}
_.onmessage = async (e) => {
	let t = e.data;
	if (!(!t || typeof t.id != "string" || !/^[A-Za-z0-9_-]{8,100}$/.test(t.id) || !["load", "generate"].includes(t.kind))) {
		if (b) {
			T(t.id, "error", { message: "A sample is already running." });
			return;
		}
		b = !0;
		try {
			if (t.kind === "load") {
				await E(t.id);
				return;
			}
			if (!v || !y || typeof t.prompt != "string" || t.prompt.length > 6400) throw Error("Model unavailable.");
			let e = y.encode(t.prompt).length;
			if (!p(e)) {
				T(t.id, "error", { message: "This sample exceeds the model context. Choose a shorter question." });
				return;
			}
			await v.resetChat();
			let n = performance.now(), r = await v.completions.create({
				model: x.modelId,
				prompt: t.prompt,
				max_tokens: 256,
				temperature: .7,
				top_p: .8,
				seed: 42,
				stream: !1
			}), i = r.choices[0], a = r.usage;
			if (i?.finish_reason !== "stop" || a?.prompt_tokens !== e || !p(a.prompt_tokens) || a.completion_tokens > 256) throw Error("Incomplete or mismatched output.");
			T(t.id, "result", {
				reply: i.text,
				promptTokens: e,
				outputTokens: a.completion_tokens,
				generationMs: Math.round(performance.now() - n)
			});
		} catch {
			v = null, y?.dispose(), y = null, T(t.id, "error", { message: "Qwen could not complete this sample. Check model files and browser GPU support, then retry." });
		} finally {
			b = !1;
		}
	}
};
//#endregion
