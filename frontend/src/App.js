import { useState, useEffect } from "react";
import './App.css';

function App() {
    const [activeTab, setActiveTab] = useState("quick");
    const [quickEntryForm, setQuickEntryForm] = useState({ description: "", items_asked_for: "" });
    const [allEntries, setAllEntries] = useState([]);
    const [statusMessage, setStatusMessage] = useState("");
    const [collapsedEntries, setCollapsedEntries] = useState({});


    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setQuickEntryForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleQuickFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("http://localhost:5000/entries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(quickEntryForm),
            });
            const data = await res.json();
            setStatusMessage(data.message || "Error submitting entry.");
            setQuickEntryForm({ description: "", items_asked_for: "" });
        } catch (err) {
            console.error("Error submitting form:", err);
        }
    }

    useEffect(() => {
        if (activeTab == "view") {
            fetchAllEntries();
        }
    }, [activeTab])

    const fetchAllEntries = async () => {
        try {
            const res = await fetch("http://localhost:5000/entries");
            const data = await res.json();
            setAllEntries(data);
        } catch (err) {
            console.error("Error fetching entries:", err);
        }
    };

    const handleEntryFieldChange = (id, field, value) => {
        setAllEntries((prev) =>
            prev.map((entry) =>
                entry.id === id ? { ...entry, [field]: value } : entry
            )
        );
    };

    const saveEntryChanges = async (entry) => {
        try {
            await fetch(`http://localhost:5000/entries/${entry.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(entry),
            });
        } catch (err) {
            console.error("Error updating entry:", err);
        }
    };

    const deleteEntryById = async (id) => {
        try {
            await fetch(`http://localhost:5000/entries/${id}`, { method: "DELETE" });
            setAllEntries((prev) => prev.filter((entry) => entry.id !== id));
        } catch (err) {
            console.error("Error deleting entry: ", err);
        }
    };

    const toggleCollapse = (id) => {
        setCollapsedEntries((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    return (
        <div className="container">
            <h1>Street Medicine Log</h1>
            <div className="tabs">
                <button className="tab-button" onClick={() => setActiveTab("quick")}>Quick Entry</button>
                <button className="tab-button" onClick={() => setActiveTab("view")}>View and Edit Entries</button>
            </div>


            {activeTab === "quick" && (
                <form className="entry-form" onSubmit={handleQuickFormSubmit}>
                    <input
                        className="form-input"
                        name="description"
                        placeholder="Description:"
                        value={quickEntryForm.description}
                        onChange={handleFormChange}
                    />
                    <input
                        className="form-input"
                        name="items_asked_for"
                        placeholder="Items asked for:"
                        value={quickEntryForm.items_asked_for}
                        onChange={handleFormChange}
                    />
                    <button className="submit-button" type="submit">Submit</button>
                    <p>{statusMessage}</p>
                </form>
            )}



            {activeTab === "view" &&
                allEntries.map((entry) => (
                    <div key={entry.id} className="entry-card">
                        <div className="entry-header">
                            <strong>{entry.description || "Unnamed Entry"}</strong>
                            <button className="collapse-button" onClick={() => toggleCollapse(entry.id)}>
                                {collapsedEntries[entry.id] ? "Expand" : "Collapse"}
                            </button>
                        </div>
                        {!collapsedEntries[entry.id] && (
                            <div className="entry-body">

                                <input
                                    className="form-input"
                                    placeholder="Description"
                                    value={entry.description || ""}
                                    onChange={(e) => handleEntryFieldChange(entry.id, "description", e.target.value)}
                                />
                                <input
                                    className="form-input"
                                    placeholder="Items asked for"
                                    value={entry.items_asked_for || ""}
                                    onChange={(e) => handleEntryFieldChange(entry.id, "items_asked_for", e.target.value)}
                                />
                                <div className="section">
                                    <p>Points of Contact</p>
                                    {["Subaru", "Speedway", "Atlantic", "Riverside"].map((location) => (
                                        <label key={location}>
                                            <input
                                                type="checkbox"
                                                checked={(entry.points_of_contact || "").includes(location)}
                                                onChange={(e) => {
                                                    const current = entry.points_of_contact?.split(", ") || [];
                                                    let updated;
                                                    if (e.target.checked) {
                                                        updated = [...current, location];
                                                    } else {
                                                        updated = current.filter((val) => val !== location);
                                                    }
                                                    handleEntryFieldChange(entry.id, "points_of_contact", updated.join(", "));
                                                }}
                                            />
                                            {location}
                                        </label>
                                    ))}
                                </div>

                                <div className="section">
                                    {[

                                        "medical advice given",
                                        "addiction counseling",
                                        "medical supplies given",
                                        "community resources discussed",
                                        "hospitality items given",
                                        "narcan"

                                    ].map((field) => (
                                        <div key={field}>
                                            <p>{field.replaceAll("_", "")}</p>
                                            <label>
                                                <input
                                                    type="radio"
                                                    name={`${field}-{entry.id}`}
                                                    value="yes"
                                                    checked={entry[field] === "yes"}
                                                    onChange={(e) => handleEntryFieldChange(entry.id, field, e.target.value)}
                                                />
                                                Yes
                                            </label>
                                            <label>
                                                <input
                                                    type="radio"
                                                    name={`${field}-${entry.id}`}
                                                    value="no"
                                                    checked={entry[field] === "no"}
                                                    onChange={(e) => handleEntryFieldChange(entry.id, field, e.target.value)}
                                                />
                                                No
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                {entry.narcan === "yes" && (
                                    <div className="narcan-section">
                                        <input
                                            className="form-input"
                                            placeholder="Narcan Recipient Name"
                                            value={entry.narcan_recipient_name || ""}
                                            onChange={(e) => handleEntryFieldChange(entry.id, "narcan_recipient_name", e.target.value)}
                                        />
                                        <input
                                            className="form-input"
                                            type="date"
                                            value={entry.narcan_dob || ""}
                                            onChange={(e) => handleEntryFieldChange(entry.id, "narcan_dob", e.target.value)}
                                        />
                                        <input
                                            className="form-input"
                                            type="number"
                                            placeholder="Number of Doses"
                                            value={entry.narcan_doses || ""}
                                            onChange={(e) => handleEntryFieldChange(entry.id, "narcan_doses", e.target.value)}
                                        />
                                    </div>
                                )}
                                <label className="complete-checkbox">
                                    Complete:
                                    <input
                                        type="checkbox"
                                        checked={entry.is_complete}
                                        onChange={(e) => handleEntryFieldChange(entry.id, "is_complete", e.target.checked)}
                                    />
                                </label>

                                <div className="entry-button">
                                    <button className="save-button" onClick={() => saveEntryChanges(entry)}>
                                        Save
                                    </button>
                                    <button className="delete-button" onClick={() => deleteEntryById(entry.id)}>Delete</button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
        </div>

    );
}

export default App;
