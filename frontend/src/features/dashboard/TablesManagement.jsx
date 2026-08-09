import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Trash2, Plus, QrCode, RefreshCw, Power, PowerOff, Download } from 'lucide-react';

export default function TablesManagement() {
  const [tables, setTables] = useState([]);
  const [newTable, setNewTable] = useState('');

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const { data } = await api.get('/tables');
      setTables(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTable) return;
    try {
      await api.post('/tables', { tableNumber: newTable });
      setNewTable('');
      fetchTables();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding table');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this table?')) return;
    try {
      await api.delete(`/tables/${id}`);
      fetchTables();
    } catch (err) {
      alert('Error deleting table');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.patch(`/tables/${id}/toggle-status`);
      fetchTables();
    } catch (err) {
      alert('Error toggling status');
    }
  };

  const handleRegenerateQr = async (id) => {
    if (!window.confirm('Regenerate QR Code? Old printed codes will still point to the same URL but the link hash will change if you use versioning.')) return;
    try {
      await api.post(`/tables/${id}/regenerate-qr`);
      fetchTables();
    } catch (err) {
      alert('Error regenerating QR');
    }
  };

  const downloadQr = (qrCodeUrl, tableNumber) => {
    // Generate QR using public API for downloading
    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeUrl)}`;
    
    // Fetch image and create a blob link to bypass cross-origin download issues
    fetch(qrImage)
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Table_${tableNumber}_QR.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(console.error);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-lg font-medium mb-4 text-gray-800">Manage Tables</h3>
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTable}
          onChange={(e) => setNewTable(e.target.value)}
          placeholder="Table Number (e.g., T-01)"
          className="border border-gray-300 rounded-md px-3 py-2 flex-1 max-w-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-1 transition-colors">
          <Plus size={18} /> Add Table
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map(table => (
          <div key={table._id} className={`border p-4 rounded-lg flex flex-col bg-gray-50 hover:bg-gray-100 transition-colors shadow-sm ${!table.isActive ? 'opacity-60 border-gray-300' : 'border-gray-200'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                 <div className="bg-white p-2 rounded-md shadow-sm border border-gray-200">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(table.qrCodeUrl)}`} 
                      alt={`QR for Table ${table.tableNumber}`}
                      className="w-12 h-12"
                    />
                 </div>
                 <div>
                    <p className="font-semibold text-gray-800 text-lg">Table {table.tableNumber}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${table.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {table.isActive ? 'Active' : 'Disabled'}
                    </span>
                 </div>
              </div>
              <button onClick={() => handleDelete(table._id)} className="text-red-500 hover:text-red-700 p-1.5 bg-white rounded shadow-sm border border-gray-100 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-gray-200 mt-auto">
              <div className="flex gap-2">
                <button 
                  onClick={() => handleToggleStatus(table._id)} 
                  title={table.isActive ? "Disable Table" : "Enable Table"}
                  className="p-1.5 text-gray-600 hover:text-gray-900 bg-white rounded shadow-sm border border-gray-100"
                >
                  {table.isActive ? <PowerOff size={16} /> : <Power size={16} className="text-green-600" />}
                </button>
                <button 
                  onClick={() => handleRegenerateQr(table._id)} 
                  title="Regenerate QR Code"
                  className="p-1.5 text-blue-600 hover:text-blue-800 bg-white rounded shadow-sm border border-gray-100"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
              
              <button 
                onClick={() => downloadQr(table.qrCodeUrl, table.tableNumber)}
                className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded flex items-center gap-1 hover:bg-gray-900 transition-colors"
              >
                <Download size={14} /> QR
              </button>
            </div>
          </div>
        ))}
        {tables.length === 0 && <p className="text-gray-500 col-span-full">No tables found. Add one above.</p>}
      </div>
    </div>
  );
}
