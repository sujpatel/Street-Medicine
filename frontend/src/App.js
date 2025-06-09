import { useState, useEffect } from "react";


function App() {
  const [formData, setFormData] = useState({
    name: "",
    items_given: "",
    appearance: "",

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
      const data = await response.json();
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
    const res = await fetch(`https://localhost:5000/entries/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });

    const data = await res.join();
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

}