export function Tabs({ activeTab, onChange }) {
  const tabs = ['Today', 'Goals', 'History']

  return (
    <nav className="tabs">
      {tabs.map(tab => (
        <button
          key={tab}
          className={activeTab === tab ? 'tab active' : 'tab'}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </nav>
  )
}
