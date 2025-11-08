
import React, { useState, useEffect } from "react";


const BACKEND_BASE_URL = 'http://10.42.0.1:8000';
const TABS = [
  { key: 'addUser', label: 'Add User' },
  { key: 'addChannel', label: 'Add Channel' },
  { key: 'userList', label: 'User List' },
  { key: 'channelList', label: 'Channel List' },
  { key: 'userChannel', label: 'User-Channel Info' },
];

function AdminDashboard() {
  // Get token from localStorage
  const token = localStorage.getItem('access_token');
  const [activeTab, setActiveTab] = useState('addUser');
  const [addUserForm, setAddUserForm] = useState({ email: '', username: '', password: '', role: 'teacher', first_name: '', last_name: '' });
  // Optionally, get admin email from localStorage if needed for other features
  const adminEmail = (JSON.parse(localStorage.getItem('user_data'))?.email) || '';
  const [addChannelForm, setAddChannelForm] = useState({ name: '', status: 'active' });
  const [userList, setUserList] = useState([]);
  const [channelList, setChannelList] = useState([]);
  const [userChannelList, setUserChannelList] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch lists on tab change or refresh
  useEffect(() => {
    if (activeTab === 'userList') fetchUserList();
    if (activeTab === 'channelList') fetchChannelList();
    if (activeTab === 'userChannel') fetchUserChannelList();
  }, [activeTab]);


  // Fetch user list
  const fetchUserList = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/admin/get_user_list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      console.log('User list response:', data);
      if (Array.isArray(data.users)) {
        setUserList(data.users);
      } else {
        setMessage('User list format error or no users found');
        setUserList([]);
      }
    } catch (e) {
      setMessage('Failed to fetch user list');
      setUserList([]);
    }
    setLoading(false);
  };

  // Fetch channel list
  const fetchChannelList = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/admin/get_channel_list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setChannelList(data.channel || []);
    } catch (e) {
      setMessage('Failed to fetch channel list');
    }
    setLoading(false);
  };

  // Fetch user-channel info
  const fetchUserChannelList = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/admin/get_userinfo_at_channel`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setUserChannelList(data.UserInfo || []);
    } catch (e) {
      setMessage('Failed to fetch user-channel info');
    }
    setLoading(false);
  };

  // Add user
  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      // Send AddUserRequest payload as per backend schema
      const payload = {
        email: addUserForm.email,
        username: addUserForm.username,
        password: addUserForm.password, // admin sets password for user
        role: addUserForm.role,
        first_name: addUserForm.first_name,
        last_name: addUserForm.last_name,
      };
      const res = await fetch(`${BACKEND_BASE_URL}/admin/add_user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMessage('User added successfully');
        setAddUserForm({ email: '', username: '', password: '', role: 'teacher', first_name: '', last_name: '' });
        // Refresh user list after adding
        await fetchUserList();
      } else {
        // Try to show backend error detail
        let errorMsg = 'Failed to add user';
        try {
          const errorData = await res.json();
          if (errorData && errorData.detail) {
            errorMsg = errorData.detail;
          } else if (errorData && errorData.msg) {
            errorMsg = errorData.msg;
          }
        } catch {}
        setMessage(errorMsg);
      }
    } catch (e) {
      setMessage('Error adding user');
    }
    setLoading(false);
  };

  // Add channel
  const handleAddChannel = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/admin/add_channel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(addChannelForm),
      });
      if (res.ok) {
        setMessage('Channel added successfully');
        setAddChannelForm({ name: '', status: 'active' });
      } else {
        setMessage('Failed to add channel');
      }
    } catch (e) {
      setMessage('Error adding channel');
    }
    setLoading(false);
  };

  // Fetch user profile
  const fetchUserProfile = async (userId) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/admin/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setUserProfile(data);
    } catch (e) {
      setMessage('Failed to fetch user profile');
    }
    setLoading(false);
  };

  // UI
  return (
    <div className="admin-dashboard" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui', background: 'var(--background)', minHeight: '100vh', padding: 0, margin: 0 }}>
      <style>{`
        :root {
          --discord-blurple: #5865F2;
          --discord-blurple-2: #404EED;
          --bg-deep: #0f1226;
          --bg-mid: #0b0d16;
          --card: #0f1724;
          --muted: #99AAB5;
          --label: #B9BBBE;
          --white: #FFFFFF;
          --danger: #ff6b6b;
          --success: #3ad29f;
          --glass: rgba(255,255,255,0.03);
          --glass-2: rgba(255,255,255,0.02);
          --shadow: 0 8px 30px rgba(2,6,23,0.6);
          --radius: 14px;
          --transition: 0.28s;
          --primary: var(--discord-blurple);
          --secondary: rgba(255,255,255,0.04);
          --foreground: #E6EDF3;
          --muted-foreground: #9AA7B2;
          --background: linear-gradient(180deg, rgba(10,12,20,1) 0%, rgba(5,7,12,1) 100%);
          --chat-bubble: rgba(255,255,255,0.03);
          --chat-bubble-own: linear-gradient(90deg, rgba(88,101,242,0.95), rgba(64,78,237,0.95));
          --primary-glow: rgba(88,101,242,0.95);
          --border: rgba(255,255,255,0.04);
          --chat-input: rgba(255,255,255,0.02);
          --font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          --radius-xl: 14px;
        }
      `}</style>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px 0 32px', background: 'var(--card)', boxShadow: 'var(--shadow)' }}>
        <h2 style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 28, letterSpacing: 1 }}>Admin Dashboard</h2>
        <nav style={{ display: 'flex', gap: 12 }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setMessage(''); }}
              style={{
                padding: '10px 22px',
                borderRadius: 'var(--radius)',
                border: activeTab === tab.key ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: activeTab === tab.key ? 'var(--primary)' : 'var(--card)',
                color: activeTab === tab.key ? '#fff' : 'var(--muted-foreground)',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: activeTab === tab.key ? 'var(--shadow)' : 'none',
                transition: 'all 0.2s',
                fontSize: 16,
              }}
            >{tab.label}</button>
          ))}
        </nav>
      </header>

      {message && <div style={{ margin: '24px 32px 0 32px', color: message.includes('success') ? 'var(--success)' : 'var(--danger)', fontWeight: 600, fontSize: 17 }}>{message}</div>}

      <main style={{ padding: '32px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {/* Add User Form */}
        {activeTab === 'addUser' && (
          <form onSubmit={handleAddUser} style={{ maxWidth: 520, margin: '0 auto', background: 'var(--glass)', padding: 32, borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow)', color: 'var(--foreground)' }}>
            <h3 style={{ marginBottom: 18, color: 'var(--primary)', fontWeight: 700 }}>Add User</h3>
            {/* Admin's own email is not shown or editable here */}
            <input type="email" required placeholder="User Email" value={addUserForm.email} onChange={e => setAddUserForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
            <input type="text" required placeholder="Username" value={addUserForm.username} onChange={e => setAddUserForm(f => ({ ...f, username: e.target.value }))} style={inputStyle} />
            <input type="password" required placeholder="Set Password for User" value={addUserForm.password} onChange={e => setAddUserForm(f => ({ ...f, password: e.target.value }))} style={inputStyle} />
            <select required value={addUserForm.role} onChange={e => setAddUserForm(f => ({ ...f, role: e.target.value }))} style={inputStyle}>
              <option value="sys_admin">Sys Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
            <input type="text" required placeholder="First Name" value={addUserForm.first_name} onChange={e => setAddUserForm(f => ({ ...f, first_name: e.target.value }))} style={inputStyle} />
            <input type="text" required placeholder="Last Name" value={addUserForm.last_name} onChange={e => setAddUserForm(f => ({ ...f, last_name: e.target.value }))} style={inputStyle} />
            <button type="submit" disabled={loading} style={buttonStyle}>Add User</button>
          </form>
        )}

        {/* Add Channel Form */}
        {activeTab === 'addChannel' && (
          <form onSubmit={handleAddChannel} style={{ maxWidth: 420, margin: '0 auto', background: 'var(--glass)', padding: 32, borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow)', color: 'var(--foreground)' }}>
            <h3 style={{ marginBottom: 18, color: 'var(--primary)', fontWeight: 700 }}>Add Channel</h3>
            <input type="text" required placeholder="Channel Name" value={addChannelForm.name} onChange={e => setAddChannelForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
            <select required value={addChannelForm.status} onChange={e => setAddChannelForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
              <option value="deleted">Deleted</option>
            </select>
            <button type="submit" disabled={loading} style={buttonStyle}>Add Channel</button>
          </form>
        )}

        {/* User List Table */}
        {activeTab === 'userList' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ color: 'var(--primary)', fontWeight: 700 }}>User List</h3>
              <button onClick={fetchUserList} style={buttonStyle}>Refresh</button>
            </div>
            <div style={{ overflowX: 'auto', background: 'var(--glass)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow)' }}>
              <table style={tableStyle}>
                <thead style={{ background: 'var(--card)', color: 'var(--primary)', fontWeight: 700 }}>
                  <tr>
                    <th>ID</th><th>Name</th><th>Email</th><th>Status</th><th>Role</th><th>Profile</th>
                  </tr>
                </thead>
                <tbody>
                  {userList.map(u => (
                    <tr key={u.id} style={{ color: 'var(--foreground)', background: 'var(--glass-2)' }}>
                      <td>{u.id}</td>
                      <td>{u.username || u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.status}</td>
                      <td>{u.user_role || u.role}</td>
                      <td><button style={buttonStyle} onClick={() => { setSelectedUser(u.id); fetchUserProfile(u.id); }}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Channel List Table */}
        {activeTab === 'channelList' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ color: 'var(--primary)', fontWeight: 700 }}>Channel List</h3>
              <button onClick={fetchChannelList} style={buttonStyle}>Refresh</button>
            </div>
            <div style={{ overflowX: 'auto', background: 'var(--glass)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow)' }}>
              <table style={tableStyle}>
                <thead style={{ background: 'var(--card)', color: 'var(--primary)', fontWeight: 700 }}>
                  <tr>
                    <th>ID</th><th>Name</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {channelList.map(c => (
                    <tr key={c.id} style={{ color: 'var(--foreground)', background: 'var(--glass-2)' }}>
                      <td>{c.id}</td>
                      <td>{c.name}</td>
                      <td>{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* User-Channel Info Table */}
        {activeTab === 'userChannel' && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <h3 style={{ color: 'var(--primary)', fontWeight: 700 }}>User-Channel Info</h3>
              <select value={selectedChannelId} onChange={e => setSelectedChannelId(e.target.value)} style={inputStyle}>
                <option value="">All Channels</option>
                {channelList.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button onClick={fetchUserChannelList} style={buttonStyle}>Refresh</button>
            </div>
            <div style={{ overflowX: 'auto', background: 'var(--glass)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow)' }}>
              <table style={tableStyle}>
                <thead style={{ background: 'var(--card)', color: 'var(--primary)', fontWeight: 700 }}>
                  <tr>
                    <th>Channel ID</th><th>Channel Name</th><th>User ID</th><th>User Name</th><th>Status</th><th>Permission</th>
                  </tr>
                </thead>
                <tbody>
                  {userChannelList.filter(uc => !selectedChannelId || uc.channel_id === Number(selectedChannelId)).map(uc => (
                    <tr key={uc.channel_id + '-' + uc.user_id} style={{ color: 'var(--foreground)', background: 'var(--glass-2)' }}>
                      <td>{uc.channel_id}</td>
                      <td>{uc.channel_name}</td>
                      <td>{uc.user_id}</td>
                      <td>{uc.user_name}</td>
                      <td>{uc.status}</td>
                      <td>{uc.permission}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* User Profile Modal/Card */}
        {userProfile && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15,18,38,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setUserProfile(null)}>
            <div style={{ background: 'var(--card)', borderRadius: 'var(--radius-xl)', padding: 40, minWidth: 340, boxShadow: 'var(--shadow)', position: 'relative', color: 'var(--foreground)' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ color: 'var(--primary)', fontWeight: 700 }}>User Profile</h3>
              <p><b>Email:</b> {userProfile.email}</p>
              <p><b>Username:</b> {userProfile.username}</p>
              <p><b>Role:</b> {userProfile.role || userProfile.user_role}</p>
              <p><b>First Name:</b> {userProfile.first_name}</p>
              <p><b>Last Name:</b> {userProfile.last_name}</p>
              <button style={buttonStyle} onClick={() => setUserProfile(null)}>Close</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '8px 12px',
  marginBottom: 14,
  borderRadius: 6,
  border: '1px solid #ccc',
  fontSize: 15,
};

const buttonStyle = {
  padding: '8px 16px',
  borderRadius: 6,
  border: 'none',
  background: '#5865F2',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
  margin: '4px 0',
  boxShadow: '0 2px 8px rgba(88,101,242,0.08)',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  background: '#fff',
  borderRadius: 8,
  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  marginBottom: 24,
};

export default AdminDashboard;
