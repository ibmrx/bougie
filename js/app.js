document.getElementById("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const applicationNumber = "APP-" + Date.now();

  const first = document.getElementById("first").value;
  const last = document.getElementById("last").value;
  const email = document.getElementById("email").value;

  const dossierFile = document.getElementById("dossier").files[0];
  const receiptFile = document.getElementById("receipt").files[0];

  // Upload dossier
  await supabase.storage.from("documents").upload(
    `${applicationNumber}/dossier.zip`,
    dossierFile
  );

  // Upload receipt
  if (receiptFile) {
    await supabase.storage.from("documents").upload(
      `${applicationNumber}/payment receipt.pdf`,
      receiptFile
    );
  }

  // Insert into database
  await supabase.from("applications").insert([
    {
      application_number: applicationNumber,
      first_name: first,
      last_name: last,
      email: email,
      status: "pending"
    }
  ]);

  alert("Application submitted! Your number: " + applicationNumber);
});
