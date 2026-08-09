import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Trash2, Plus, Check, X, Edit, Search, Filter } from 'lucide-react';

export default function MenuBuilder() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  
  // Search and Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Forms
  const [newCat, setNewCat] = useState('');
  const [newItem, setNewItem] = useState({ name: '', categoryId: '', costPrice: '', sellingPrice: '' });
  
  // Edit State
  const [editingItem, setEditingItem] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const catRes = await api.get('/menu/categories');
      setCategories(catRes.data);
      if (catRes.data.length > 0 && !newItem.categoryId) {
        setNewItem(prev => ({ ...prev, categoryId: catRes.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
    }
  }, [newItem.categoryId]);

  const fetchItems = useCallback(async () => {
    try {
      let url = '/menu/items?';
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      if (filterCategory) url += `category=${filterCategory}&`;
      const itemRes = await api.get(url);
      setItems(itemRes.data);
    } catch (err) {
      console.error(err);
    }
  }, [searchQuery, filterCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAddCat = async (e) => {
    e.preventDefault();
    if (!newCat) return;
    try {
      await api.post('/menu/categories', { name: newCat });
      setNewCat('');
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleDeleteCat = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/menu/categories/${id}`);
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await api.post('/menu/items', newItem);
      setNewItem({ ...newItem, name: '', costPrice: '', sellingPrice: '' });
      fetchItems();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editingItem };
      if (typeof payload.categoryId === 'object' && payload.categoryId !== null) {
        payload.categoryId = payload.categoryId._id;
      }
      await api.put(`/menu/items/${editingItem._id}`, payload);
      setEditingItem(null);
      fetchItems();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(`/menu/items/${id}`);
      fetchItems();
    } catch (err) { alert('Error'); }
  };

  const toggleAvailability = async (id) => {
    try {
      await api.patch(`/menu/items/${id}/toggle`);
      fetchItems();
    } catch (err) { alert('Error'); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Categories Col */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-fit lg:col-span-1">
        <h3 className="text-lg font-medium mb-4 text-gray-800">Categories</h3>
        <form onSubmit={handleAddCat} className="flex gap-2 mb-4">
          <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="New Category" className="border border-gray-300 outline-none focus:border-blue-500 rounded px-3 py-2 flex-1 text-sm" />
          <button type="submit" className="bg-gray-800 text-white px-3 py-2 rounded flex items-center justify-center hover:bg-gray-900 transition-colors"><Plus size={18}/></button>
        </form>
        <ul className="space-y-2">
          {categories.map(c => (
            <li key={c._id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-md text-sm font-medium text-gray-700">
              {c.name}
              <button onClick={() => handleDeleteCat(c._id)} className="text-red-500 hover:text-red-700 p-1 bg-white rounded shadow-sm border border-gray-200"><Trash2 size={16}/></button>
            </li>
          ))}
        </ul>
      </div>

      {/* Items Col */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 lg:col-span-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h3 className="text-lg font-medium text-gray-800">Menu Items</h3>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search items..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm w-full sm:w-48 outline-none focus:border-blue-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm w-full sm:w-48 outline-none focus:border-blue-500 appearance-none bg-white"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {categories.length === 0 ? (
          <p className="text-sm text-gray-500 mb-6 bg-yellow-50 p-3 rounded border border-yellow-100">Create a category first to add menu items.</p>
        ) : (
          <form onSubmit={handleAddItem} className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6 bg-gray-50 p-4 rounded-md border border-gray-200 shadow-inner">
             <select value={newItem.categoryId} onChange={e => setNewItem({...newItem, categoryId: e.target.value})} className="col-span-2 md:col-span-1 border border-gray-300 rounded px-2 py-2 text-sm outline-none focus:border-blue-500 bg-white">
               {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
             </select>
             <input type="text" required placeholder="Item Name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="col-span-2 md:col-span-1 border border-gray-300 rounded px-2 py-2 text-sm outline-none focus:border-blue-500" />
             <input type="number" required min="0" placeholder="Cost" value={newItem.costPrice} onChange={e => setNewItem({...newItem, costPrice: e.target.value})} className="border border-gray-300 rounded px-2 py-2 text-sm outline-none focus:border-blue-500" />
             <input type="number" required min="0" placeholder="Selling Price" value={newItem.sellingPrice} onChange={e => setNewItem({...newItem, sellingPrice: e.target.value})} className="border border-gray-300 rounded px-2 py-2 text-sm outline-none focus:border-blue-500" />
             <button type="submit" className="col-span-2 md:col-span-1 bg-blue-600 text-white rounded px-2 py-2 text-sm flex items-center justify-center gap-1 hover:bg-blue-700 transition-colors shadow-sm font-medium"><Plus size={16}/> Add</button>
          </form>
        )}

        <div className="overflow-x-auto rounded-md border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Profit</th>
                <th className="px-4 py-3 text-center">Available</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(item => {
                const profit = (item.sellingPrice - item.costPrice).toFixed(2);
                return (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3 text-gray-500">{item.categoryId?.name}</td>
                    <td className="px-4 py-3 text-gray-600">₹{Number(item.costPrice).toFixed(2)}</td>
                    <td className="px-4 py-3 font-bold text-gray-800">₹{Number(item.sellingPrice).toFixed(2)}</td>
                    <td className={`px-4 py-3 font-semibold ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>₹{profit}</td>
                    <td className="px-4 py-3 flex justify-center">
                      <button onClick={() => toggleAvailability(item._id)} className={`px-2 py-1 rounded text-xs flex items-center gap-1 font-medium transition-colors ${item.isAvailable ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                        {item.isAvailable ? <Check size={12}/> : <X size={12}/>} {item.isAvailable ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingItem(item)} className="text-blue-500 hover:text-blue-700 p-1.5 bg-white border border-gray-100 rounded shadow-sm hover:shadow transition-all"><Edit size={16}/></button>
                        <button onClick={() => handleDeleteItem(item._id)} className="text-red-500 hover:text-red-700 p-1.5 bg-white border border-gray-100 rounded shadow-sm hover:shadow transition-all"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No menu items found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Edit Menu Item</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input 
                  type="text" 
                  value={editingItem.name} 
                  onChange={e => setEditingItem({...editingItem, name: e.target.value})} 
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  value={editingItem.categoryId._id || editingItem.categoryId} 
                  onChange={e => setEditingItem({...editingItem, categoryId: e.target.value})} 
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
                >
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                  <input 
                    type="number" 
                    value={editingItem.costPrice} 
                    onChange={e => setEditingItem({...editingItem, costPrice: e.target.value})} 
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500" 
                    required min="0" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
                  <input 
                    type="number" 
                    value={editingItem.sellingPrice} 
                    onChange={e => setEditingItem({...editingItem, sellingPrice: e.target.value})} 
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500" 
                    required min="0" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setEditingItem(null)} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
