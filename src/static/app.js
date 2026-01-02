document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <p><strong>Participants:</strong></p>
          <ul class="participants-list">
            ${
              details.participants.length > 0
                ? details.participants.map(participant => `
                  <li>
                    ${participant}
                    <button class="delete-participant" onclick="unregisterParticipant('${participant}')">❌</button>
                  </li>
                `).join("")
                : "<li>No participants yet</li>"
            }
          </ul>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Function to dynamically update the participant list
  function updateParticipantList(activityName, participants) {
    const activityCards = document.querySelectorAll(".activity-card");

    activityCards.forEach(card => {
      if (card.querySelector("h4").textContent === activityName) {
        const participantList = card.querySelector(".participants-list");
        const spotsLeftElement = card.querySelector("p strong");

        participantList.innerHTML = participants.length > 0
          ? participants.map(participant => `
              <li>
                ${participant}
                <button class="delete-participant" onclick="unregisterParticipant('${participant}')">❌</button>
              </li>
            `).join("")
          : "<li>No participants yet</li>";

        const spotsLeft = parseInt(spotsLeftElement.textContent.split(" ")[0]) - participants.length;
        spotsLeftElement.textContent = `${spotsLeft} spots left`;
      }
    });
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        updateParticipantList(activity, result.updatedParticipants);
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Modify the unregisterParticipant function
  function unregisterParticipant(participant) {
    fetch(`/unregister`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ participant }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert(`${participant} has been unregistered.`);
        updateParticipantList(data.activityName, data.updatedParticipants);
      } else {
        alert('Failed to unregister participant.');
      }
    });
  }

  // Initialize app
  fetchActivities();
});
