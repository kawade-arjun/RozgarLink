import React, { useState } from "react";

export default function CandidateForm({ onSaveProfile }) {
    const [formData, setFormData] = useState({
        fullName: "Siddhi Patil",
        degree: "B.Tech / B.E.",
        domicile: "Maharashtra",
        age: 21,
        experienceYears: 0,
        minSalary: 25000,
        maxDistance: 15,
        preferredMode: "Hybrid",
        preferredShift: "Day",
        // Priority weights (Default: 70% Skill, 30% Preferences)
        skillWeight: 70,
        salaryWeight: 15,
        distanceWeight: 15,
    });

    const [skills, setSkills] = useState(["React", "JavaScript", "HTML/CSS", "SQL", "Git"]);
    const [newSkill, setNewSkill] = useState("");

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? Number(value) : value,
        }));
    };

    const handleSliderChange = (e) => {
        const skillVal = Number(e.target.value);
        const remaining = 100 - skillVal;
        // Split the remaining percentage evenly between salary and distance
        setFormData((prev) => ({
            ...prev,
            skillWeight: skillVal,
            salaryWeight: Math.round(remaining / 2),
            distanceWeight: remaining - Math.round(remaining / 2),
        }));
    };

    const addSkill = (e) => {
        e.preventDefault();
        if (newSkill.trim() && !skills.includes(newSkill.trim())) {
            setSkills([...skills, newSkill.trim()]);
            setNewSkill("");
        }
    };

    const removeSkill = (skillToRemove) => {
        setSkills(skills.filter((s) => s !== skillToRemove));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            skills,
        };
        if (onSaveProfile) {
            onSaveProfile(payload);
        }
    };

    return (
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md border border-slate-200 p-6 md:p-8 font-sans">
            <div className="border-b border-slate-200 pb-4 mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Candidate Profile & Matching Preferences</h2>
                <p className="text-sm text-slate-500 mt-1">
                    Set your eligibility credentials and adjust priority sliders to personalize your job feed.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section 1: Gate 1 Mandatory Criteria */}
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600 mb-3">
                        1. Eligibility & Demographics (Gate 1)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Highest Degree</label>
                            <select
                                name="degree"
                                value={formData.degree}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="Diploma">Diploma / 12th Pass</option>
                                <option value="B.Tech / B.E.">B.Tech / B.E. / Bachelor's</option>
                                <option value="M.Tech / M.E.">M.Tech / M.E. / Master's</option>
                                <option value="PhD">Doctorate / PhD</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">State Domicile</label>
                            <select
                                name="domicile"
                                value={formData.domicile}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="Maharashtra">Maharashtra</option>
                                <option value="Karnataka">Karnataka</option>
                                <option value="Gujarat">Gujarat</option>
                                <option value="Delhi">Delhi (NCR)</option>
                                <option value="All India">Other / All India</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Age</label>
                                <input
                                    type="number"
                                    name="age"
                                    min="18"
                                    max="65"
                                    value={formData.age}
                                    onChange={handleChange}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Experience (Yrs)</label>
                                <input
                                    type="number"
                                    name="experienceYears"
                                    min="0"
                                    max="40"
                                    value={formData.experienceYears}
                                    onChange={handleChange}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Technical Skills */}
                <div className="pt-2 border-t border-slate-100">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600 mb-3">
                        2. Competency & Skills
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {skills.map((skill) => (
                            <span
                                key={skill}
                                className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-medium"
                            >
                                {skill}
                                <button
                                    type="button"
                                    onClick={() => removeSkill(skill)}
                                    className="hover:text-red-500 font-bold ml-1"
                                >
                                    &times;
                                </button>
                            </span>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Add skill (e.g., Python, Figma, Tailwind)"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            className="flex-1 border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button
                            type="button"
                            onClick={addSkill}
                            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Add
                        </button>
                    </div>
                </div>

                {/* Section 3: Life & Working Preferences */}
                <div className="pt-2 border-t border-slate-100">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600 mb-3">
                        3. Working Preferences (Gate 2 Fit)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Min Expected Salary (₹/month)
                            </label>
                            <input
                                type="number"
                                name="minSalary"
                                step="1000"
                                value={formData.minSalary}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Max Daily Commute Radius (km)
                            </label>
                            <input
                                type="number"
                                name="maxDistance"
                                value={formData.maxDistance}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Preferred Work Mode</label>
                            <select
                                name="preferredMode"
                                value={formData.preferredMode}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="Hybrid">Hybrid</option>
                                <option value="On-site">On-site</option>
                                <option value="Remote">Remote</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Shift Flexibility</label>
                            <select
                                name="preferredShift"
                                value={formData.preferredShift}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="Day">Day Shift</option>
                                <option value="Flexible">Flexible / Rotational</option>
                                <option value="Night">Night Shift</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Section 4: Flexible Ranking Sliders */}
                <div className="pt-2 border-t border-slate-100 bg-slate-50 p-4 rounded-xl border">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                            4. Ranking Weight Priorities
                        </h3>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-semibold">
                            {formData.skillWeight}% Skills / {100 - formData.skillWeight}% Fit
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                        Slide to prioritize technical capability vs. practical life factors (Pay & Distance).
                    </p>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                                <span>Skills Priority Weight</span>
                                <span className="font-bold text-slate-800">{formData.skillWeight}%</span>
                            </div>
                            <input
                                type="range"
                                min="30"
                                max="90"
                                step="5"
                                value={formData.skillWeight}
                                onChange={handleSliderChange}
                                className="w-full accent-blue-600 cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                                <span>30% (Proximity Focus)</span>
                                <span>70% (Standard Default)</span>
                                <span>90% (Pure Technical)</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-600">
                            <div className="bg-white p-2.5 rounded border border-slate-200">
                                <span className="block text-[11px] text-slate-400">Derived Salary Weight</span>
                                <span className="font-semibold text-slate-700">{formData.salaryWeight}%</span>
                            </div>
                            <div className="bg-white p-2.5 rounded border border-slate-200">
                                <span className="block text-[11px] text-slate-400">Derived Distance Weight</span>
                                <span className="font-semibold text-slate-700">{formData.distanceWeight}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg shadow-sm transition-colors text-sm"
                    >
                        Save Profile & Update Feed
                    </button>
                </div>
            </form>
        </div>
    );
}