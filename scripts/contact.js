document
  .getElementById("contact-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const statusEl = document.getElementById("form-status");
    const submitBtn = form.querySelector('button[type="submit"]');
    const inputs = form.querySelectorAll("input, textarea");

    const RECEIVER_EMAIL = "rabiamansoor816@gmail.com";

    submitBtn.disabled = true;
    statusEl.textContent = "Sending...";
    statusEl.style.color = "blue";
    const clearSuccessMessage = () => {
      if (statusEl.textContent.includes("✓")) {
        statusEl.textContent = "";
      }
    };

    inputs.forEach((input) => {
      input.addEventListener("focus", clearSuccessMessage);
      input.addEventListener("input", clearSuccessMessage);
    });

    try {
      const formData = new FormData(form);

      formData.append("_captcha", "false");
      formData.append("_template", "table");
      formData.append("_subject", `New message from ${formData.get("name")}`);

      const response = await fetch(
        `https://formsubmit.co/ajax/${RECEIVER_EMAIL}`,
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        statusEl.textContent = "✓ Message sent!";
        statusEl.style.color = "green";

        form.reset();

        setTimeout(clearSuccessMessage, 2000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error:", error);
      statusEl.textContent = `✗ Error: ${error.message}`;
      statusEl.style.color = "red";

      const email = form.querySelector('[name="email"]').value;
      const body = encodeURIComponent(
        form.querySelector('[name="message"]').value
      );
      statusEl.innerHTML += `<br>Alternatively, <a href="mailto:${RECEIVER_EMAIL}?subject=Message from ${email}&body=${body}">click here to email us directly</a>`;
    } finally {
      submitBtn.disabled = false;
    }
  });
