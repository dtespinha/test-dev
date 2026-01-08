import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  return await response.json();
}

function InfoSection({ title, children }) {
  return (
    <div>
      <h3>{title}</h3>
      <div style={{ marginLeft: "24px" }}>{children}</div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <p>
      {label}: {value}
    </p>
  );
}

function useStatusData() {
  return useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });
}

export default function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <Status />
      <Dependencies />
    </>
  );
}

function UpdatedAt() {
  const { isLoading, data } = useStatusData();

  let updatedAtText = "Loading...";

  if (!isLoading && data) {
    updatedAtText = new Date(data.updated_at).toLocaleString("pt-BR");
  }

  return (
    <InfoSection title="Last updated">
      <InfoItem label="Date/Time" value={updatedAtText} />
    </InfoSection>
  );
}

function Status() {
  const { isLoading, data } = useStatusData();

  let statusText = "Loading...";

  if (!isLoading && data) {
    statusText = data.status.toUpperCase();
  }

  return (
    <InfoSection title="System Status">
      <InfoItem label="Status" value={statusText} />
    </InfoSection>
  );
}

function Dependencies() {
  const { isLoading, data } = useStatusData();

  let dbInfo = {
    dbVersion: "Loading...",
    dbMaxConnections: "Loading...",
    dbUsedConnections: "Loading...",
  };

  if (!isLoading && data) {
    dbInfo = {
      dbVersion: data.dependencies.database.version,
      dbMaxConnections: data.dependencies.database.max_connections,
      dbUsedConnections: data.dependencies.database.used_connections,
    };
  }

  return (
    <InfoSection title="Database Info">
      <InfoItem label="Database Version" value={dbInfo.dbVersion} />
      <InfoItem
        label="Database Max Connections"
        value={dbInfo.dbMaxConnections}
      />
      <InfoItem
        label="Database Opened Connections"
        value={dbInfo.dbUsedConnections}
      />
    </InfoSection>
  );
}
