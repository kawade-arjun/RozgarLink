import React from "react";

// Mock catalogue of standard public / free learning pathways
const COURSE_CATALOGUE = [
    {
        targetSkill: "TypeScript",
        courseTitle: "TypeScript for Modern Web Applications",
        provider: "NPTEL / IIT Madras",
        duration: "4 Weeks",
        cost: "Free (Govt. Portal)",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
        targetSkill: "Data Analysis",
        courseTitle: "Data Analysis with Python & Pandas",
        provider: "Infosys Springboard",
        duration: "6 Weeks",
        cost: "Free Certification",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
        targetSkill: "GIS",
        courseTitle: "Fundamentals of Remote Sensing & GIS",
        provider: "ISRO IIRS Edusat",
        duration: "3 Weeks",
        cost: "Government Certified",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
        targetSkill: "SQL Database",
        courseTitle: "Database Management Essentials & Advanced SQL",
        provider: "Swayam / IIT Kharagpur",
        duration: "8 Weeks",
        cost: "Free (Credit Transfer)",
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
        targetSkill: "AutoCAD",
        courseTitle: "Computer Aided Design (CAD) for Urban Planning",
        provider: "NPTEL",
        duration: "5 Weeks",
        cost: "Free",
        badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    },
];

export default function SkillGapPanel({ selectedOpportunity, onClose }) {
    if (!selectedOpportunity) return null;

    const {
        title,
        department,
        matchedSkills = [],
        missingSkills = [],
        finalScore = 0,
    } = selectedOpportunity;

    // Find relevant courses for each missing skill
    const recommendedCourses = missingSkills.map((skill) => {
        const course = COURSE_CATALOGUE.find(
            (c) => c.targetSkill.toLowerCase() === skill.toLowerCase()
        );
        return {
            skill,
            course: course || {
                targetSkill: skill,
                courseTitle: `Foundations of ${skill}`,
                provider: "National Career Service (NCS) / Swayam",
                duration: "4 Weeks",
                cost: "Free Open Course",
                badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
            },
        };
    });

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 md:p-8 font-sans">
            {/* Header with Title and Close Button */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            Learning Pathway
                        </span>
                        <span className="text-xs text-slate-500">Current Match: {finalScore}%</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mt-1">{title}</h2>
                    <p className="text-xs text-slate-500">{department}</p>
                </div>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1 leading-none"
                        title="Close Panel"
                    >
                        &times;
                    </button>
                )}
            </div>

            {/* Competency Audit Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Acquired Skills */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span>✓</span> Acquired Skills ({matchedSkills.length})
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                        {matchedSkills.length > 0 ? (
                            matchedSkills.map((skill) => (
                                <span
                                    key={skill}
                                    className="bg-white text-emerald-700 border border-emerald-200 text-xs px-2.5 py-1 rounded-md font-medium"
                                >
                                    {skill}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-slate-400">No overlapping skills detected.</span>
                        )}
                    </div>
                </div>

                {/* Skill Deficits */}
                <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span>!</span> Missing Competencies ({missingSkills.length})
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                        {missingSkills.length > 0 ? (
                            missingSkills.map((skill) => (
                                <span
                                    key={skill}
                                    className="bg-white text-rose-700 border border-rose-200 text-xs px-2.5 py-1 rounded-md font-medium"
                                >
                                    {skill}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-emerald-600 font-medium">
                                100% Skill match achieved!
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Recommended Learning Pathways */}
            <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 mb-3">
                    Curated Free & Government Learning Pathways
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                    Completing these modules updates your verified profile and increases your match score for this role.
                </p>

                {recommendedCourses.length > 0 ? (
                    <div className="space-y-3">
                        {recommendedCourses.map(({ skill, course }) => (
                            <div
                                key={skill}
                                className="border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition-colors"
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-semibold text-slate-900">
                                            {course.courseTitle}
                                        </span>
                                        <span
                                            className={`text-[10px] font-semibold border px-2 py-0.5 rounded ${course.badgeColor}`}
                                        >
                                            Bridges: {skill}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span>{course.provider}</span>
                                        <span>•</span>
                                        <span>{course.duration}</span>
                                        <span>•</span>
                                        <span className="text-emerald-600 font-medium">{course.cost}</span>
                                    </div>
                                </div>

                                <a
                                    href="#enroll"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        alert(`Redirecting to official ${course.provider} portal for ${course.courseTitle}`);
                                    }}
                                    className="self-start sm:self-auto text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                                >
                                    Start Course
                                </a>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        No skill gaps to bridge. You already meet all technical qualifications for this opportunity.
                    </div>
                )}
            </div>
        </div>
    );
}