import { useState, useEffect } from "react";


function App() {
  const [tab, setTab] = useState("quick");
  const [formData, setFormData] = useState({
    name: "",
    items_given: "",


  });

  const [message, setMessage] = useState("")
  const [entries, setEntries] = useState([])

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleEditChange = (id, field, value) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const fetchEntries = async () => {
    try {
      const res = await fetch("http://localhost:5000/entries");
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      console.error("Error fetching entries:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    setMessage(data.message || data.error);


    if (res.ok) {
      fetchEntries();
      setFormData({
        name: "",
        items_given: "",
      });
    }
  };

  const handleUpdate = async (entry) => {
    const res = await fetch(`http://localhost:5000/entries/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      fetchEntries();
    } else {
      setMessage(data.error);
    }
  };


  useEffect(() => {
    fetchEntries();
  }, []);





  return (
    <div style={{ padding: "2rem" }}>
      <h1>Street Medicine App</h1>

      <div style={{ marginBottom: "1rem" }}>
        <button onClick={() => setTab("quick")}>Quick Entry</button>
        <button onClick={() => setTab("view")}>View & Edit Entries</button>
      </div>

      {tab == "quick" && (
        <>
          <h2>Quick Entry</h2>
          <form onSubmit={handleSubmit}>
            <input
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              required
            /><br /><br />
            <input
              name="items_given"
              placeholder="Items Given"
              value={formData.items_given}
              onChange={handleChange}
              required
            /><br /><br />
            <button type="submit">Submit</button>
          </form>
          {message && <p><strong>{message}</strong></p>}
        </>
      )}

      {tab == "view" && (
        <>
          <h2>All Entries</h2>
          {entries.map((entry) => (
            <div key={entry.id} style={{ borderBottom: "1px solid #ccc", padding: "1rem" }}>
              <strong>{entry.name}</strong> - {entry.items_given}
              <br />
              Appearance:{""}
              <input
                value={entry.appearance}
                onChange={(e) =>
                  handleEditChange(entry.id, "appearance", e.target.value)
                }
              />
              <br />
              Notes:{""}
              <input
                value={entry.notes}
                onChange={(e) =>
                  handleEditChange(entry.id, "notes", e.target.value)
                }
              />
              <br />
              Complete:{""}
              <input
                type="checkbox"
                checked={entry.is_complete}
                onChange={(e) =>
                  handleEditChange(entry.id, "is_complete", e.target.checked)

                }
              />
              <br />
              <button onClick={() => handleUpdate(entry)}>SaveChanges</button>
              <br />
              <small>{entry.timestamp}</small>
            </div>
          ))}
          {message && <p><strong>{message}</strong></p>}
        </>
      )}
    </div>
  );
}

export default App;