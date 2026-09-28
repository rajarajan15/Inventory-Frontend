import { useState, useEffect } from 'react';
import { api } from '../../../shared/api/api';
import { errorText } from '../../../shared/utils/errorUtils';
import { Page } from '../../../shared/components/Layout/Page';
import { Alert } from '../../../shared/components/ui/Alert';
import { Empty } from '../../../shared/components/ui/Empty';

export function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await api.users();
        setUsers(usersData);
      } catch (e) {
        setError(errorText(e));
      }
    };
    loadUsers();
  }, []);

  return (
    <Page title="Team members" subtitle="People with access to your inventory workspace.">
      <Alert text={error} />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="member">
                      <div className="avatar">{u.name?.[0]?.toUpperCase()}</div>
                      <strong>{u.name}</strong>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td><span className={`role ${u.role.toLowerCase()}`}>{u.role}</span></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!users.length && <Empty title="No team members found" text="Users will appear here when accounts are created." />}
      </section>
    </Page>
  );
}
