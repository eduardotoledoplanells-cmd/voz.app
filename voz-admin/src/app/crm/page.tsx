'use client';
import { useState, useEffect } from 'react';
import '98.css';

export default function VozCrmPage() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/voz/companies')
            .then(res => res.json())
            .then(data => {
                setCompanies(data);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, []);

    const handleNewClient = () => {
        const name = prompt("Nombre de la Empresa:");
        if (!name) return;
        const taxId = prompt("CIF/NIF:");

        fetch('/api/voz/companies', {
            method: 'POST',
            body: JSON.stringify({ name, taxId, contactEmail: 'info@' + name + '.com', balance: 0 }),
            headers: { 'Content-Type': 'application/json' }
        })
            .then(res => res.json())
            .then(newCompany => setCompanies([...companies, newCompany]));
    };

    if (loading) return <div style={{ padding: 10 }}>Cargando CRM...</div>;

    return (
        <div style={{ padding: 10, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="field-row" style={{ marginBottom: 10 }}>
                <button onClick={handleNewClient}>➕ Alta Empresa</button>
                <button disabled>Facturar</button>
            </div>

            <div className="sunken-panel" style={{ height: '300px', width: '100%', backgroundColor: 'white' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid black' }}>
                            <th>ID</th>
                            <th>Empresa</th>
                            <th>CIF/NIF</th>
                            <th>Saldo</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {companies.map(c => (
                            <tr key={c.id}>
                                <td>{c.id.substring(0, 8)}</td>
                                <td>{c.name}</td>
                                <td>{c.taxId}</td>
                                <td>{c.balance} €</td>
                                <td>
                                    <button style={{ minWidth: 60 }}>Ver</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
