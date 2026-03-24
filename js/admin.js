function login() {
  const u = document.getElementById("user").value;
  const p = document.getElementById("pass").value;

  if (u === "admin" && p === "password123") {
    document.getElementById("panel").style.display = "block";
    loadApps();
  }
}

async function loadApps() {
  const { data } = await supabase.from("applications").select("*");

  const list = document.getElementById("list");
  list.innerHTML = "";

  data.forEach(app => {
    const div = document.createElement("div");
    div.innerHTML = `
      ${app.first_name} ${app.last_name} - ${app.status}
      <button onclick="updateStatus('${app.application_number}','accepted')">Accept</button>
      <button onclick="updateStatus('${app.application_number}','rejected')">Reject</button>
    `;
    list.appendChild(div);
  });
}

async function updateStatus(id, status) {
  await supabase.from("applications")
    .update({ status: status })
    .eq("application_number", id);

  alert("Updated");
  loadApps();
}
