import React, { useState } from "react";

export default function OpportunityCard({ opportunity, onInspectPathway }) {
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [showWhatIf, setShowWhatIf] = useState(false);

    const {
        title,
        department,
        location,
        salary,
        distanceKm,
        workMode,
        isEligible,
        ineligibleReason,
        hypotheticalScore,
        finalScore = 0,
        matchedSkills = [],
        missingSkills = [],
        subScores = { skill: 0, salary: 0, distance: 0, mode: 0 },
        weights = { skill: 70, salary: 15, distance: 15 },
    } = opportunity;

    // Determine badge color based on final score
    const getScoreBadgeColor = (score) => {
        if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20";
        if (score >= 60) return "bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20";
        return "bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20";
    };

    return (
        <div
            className={`rounded-xl border transition-all duration-200 p-5 md:p-6 bg-white shadow-sm hover:shadow-md ${isEligible ? "border-slate-200" : "border-rose-200 bg-rose-50/20"
                }`}
        >
            {/* Header Row: Title, Department, and Match Badge */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                        {isEligible ? (
                            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                Gate 1: Verified
                            </span>
                        ) : (
                            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                                Gate 1: Ineligible
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{department} • {location}</p>
                </div>

                {/* Score Ring / Pill */}
                {isEligible ? (
                    <div
                        className={`flex items-center gap-1.5 self-start px-3 py-1.5 rounded-full border text-sm font-bold shadow-sm ${getScoreBadgeColor(
                            finalScore
                        )}`}
                    >
                        <span>{finalScore}%</span>
                        <span className="text-[10px] font-normal uppercase tracking-tight opacity-75">Match</span>
                    </div>
                ) : (
                    <div className="self-start px-2.5 py-1 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                        Excluded
                    </div>
                )}
            </div>

            {/* Primary Specs Bar */}
            <div className="flex flex-wrap items-center gap-4 py-2 border-y border-slate-100 text-xs text-slate-600 mb-3">
                <div className="flex items-center gap-1">
                    <span className="text-slate-400">Salary:</span>
                    <span className="font-semibold text-slate-800">₹{salary.toLocaleString()}/mo</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-slate-400">Distance:</span>
                    <span className="font-semibold text-slate-800">{distanceKm} km</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-slate-400">Mode:</span>
                    <span className="font-semibold text-slate-800">{workMode}</span>
                </div>
            </div>

            {/* Eligible View: Skills & Transparent Explanation */}
            {isEligible ? (
                <>
                    {/* Skill Overlap Badges */}
                    <div className="mb-3">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                            Skills Breakdown:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {matchedSkills.map((skill) => (
                                <span
                                    key={skill}
                                    className="inline-flex items-center text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded"
                                >
                                    ✓ {skill}
                                </span>
                            ))}
                            {missingSkills.map((skill) => (
                                <span
                                    key={skill}
                                    className="inline-flex items-center text-[11px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded"
                                >
                                    – {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Plain-Language Audit Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 mb-3 leading-relaxed">
                        <span className="font-semibold text-slate-800">Why this ranks here: </span>
                        Matches {subScores.skill}% of technical competencies ({matchedSkills.length} of{" "}
                        {matchedSkills.length + missingSkills.length} skills). Salary of ₹{salary.toLocaleString()} and commute of{" "}
                        {distanceKm} km align with your {weights.skill}/{100 - weights.skill} priority slider settings.
                    </div>

                    {/* Collapsible Math Breakdown */}
                    {showBreakdown && (
                        <div className="mb-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs space-y-1.5">
                            <div className="font-semibold text-blue-900 border-b border-blue-200 pb-1">
                                Score Formula Calculation
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-slate-700">
                                <div>Skills: <span className="font-semibold">{subScores.skill}%</span> × {weights.skill}%</div>
                                <div>Salary: <span className="font-semibold">{subScores.salary}%</span> × {weights.salary}%</div>
                                <div>Distance: <span className="font-semibold">{subScores.distance}%</span> × {weights.distance}%</div>
                            </div>
                            <p className="text-[11px] text-blue-700 pt-1">
                                Total Score = ({subScores.skill} × {weights.skill / 100}) + ({subScores.salary} × {weights.salary / 100}) + ({subScores.distance} × {weights.distance / 100}) = <span className="font-bold">{finalScore}%</span>
                            </p>
                        </div>
                    )}

                    {/* Action Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowBreakdown(!showBreakdown)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2"
                        >
                            {showBreakdown ? "Hide Math Breakdown" : "Inspect Math Breakdown"}
                        </button>

                        {missingSkills.length > 0 && onInspectPathway && (
                            <button
                                type="button"
                                onClick={() => onInspectPathway(opportunity)}
                                className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 py-1.5 rounded-lg transition-colors"
                            >
                                Bridge Skill Gaps ({missingSkills.length})
                            </button>
                        )}
                    </div>
                </>
            ) : (
                /* Ineligible View: Explicit Statutory Failure & What-If Simulator */
                <div className="space-y-3">
                    <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800">
                        <span className="font-bold">Reason:</span>
                        <span>{ineligibleReason || "Does not satisfy statutory criteria (Degree, Domicile, or Age limits)."}</span>
                    </div>

                    {/* What-If Simulator */}
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-700">What-If Simulator</span>
                            <button
                                type="button"
                                onClick={() => setShowWhatIf(!showWhatIf)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                                {showWhatIf ? "Hide" : "Preview Match Score"}
                            </button>
                        </div>

                        {showWhatIf && (
                            <p className="text-xs text-slate-600 mt-2 pt-2 border-t border-slate-100">
                                If you acquire this qualification or update this criteria, this job would immediately enter your feed at an estimated{" "}
                                <span className="font-bold text-emerald-700">{hypotheticalScore || 82}% Match</span>.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}