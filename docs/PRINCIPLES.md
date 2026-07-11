# Astro Stack Principles

These principles guide every decision made in Astro Stack.

---

# 1. Stay Close to Astro

Generated projects should feel like they were created by Astro itself.

Avoid unnecessary abstractions.

---

# 2. Developers Own the Code

Astro Stack should never become a runtime dependency.

After project creation, developers should be able to uninstall Astro Stack completely.

---

# 3. Generate Only What Is Needed

Every file.

Every dependency.

Every configuration.

Must exist because the developer chose it.

---

# 4. Production First

Generated projects should be ready for real-world development.

Avoid demo code and placeholder implementations.

---

# 5. Great Developer Experience

Every interaction should feel fast, clear, and intentional.

The CLI should be enjoyable to use.

---

# 6. Group, Don't Interrupt

Configuration should be organised into logical sections rather than a long sequence of unrelated questions.

Developers should think in terms of:

- Project
- Styling
- Content
- Features
- Deployment

—not individual prompts.

The setup process should feel like configuring a project, not completing a survey.

---

# 7. Smart Defaults

Provide sensible defaults for every option.

Developers should rarely need to change more than a few selections.

---

# 8. Native Before Custom

Prefer official Astro features whenever possible.

Never reinvent existing Astro functionality.

---

# 9. Consistency

Every generated project should follow the same conventions for:

- structure
- naming
- formatting
- configuration

---

# 10. Modular by Design

Every feature should be isolated.

Adding or removing a feature should require minimal changes to the rest of the codebase.

---

# 11. Every Prompt Must Earn Its Place

Every question should have a meaningful impact on the generated project.

If an answer does not change the output, it should not be asked.
