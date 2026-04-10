
import React, { useState, useEffect } from 'react';
import { useTds } from '../store';
import { Deductor, Deductee, EntityType, STATES, MINISTRIES } from '../types';
import { Plus, Edit2, Check, X, Building, User, Mail, Phone, MapPin, Copy, Search, AlertCircle, FileUp } from 'lucide-react';
import { ImportModal } from './ImportModal';

export const DeductorManager: React.FC = () => {
  const { deductors, addDeductor, updateDeductor, activeDeductorId, setActiveDeductor } = useTds();
  const [isEditing, setIsEditing] = useState(false);
  const [currentDeductor, setCurrentDeductor] = useState<Partial<Deductor>>({ type: EntityType.Company });
  const [copyCompanyDetails, setCopyCompanyDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const { refreshData } = useTds();

  const handleImport = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/import/deductors', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        await refreshData();
        return { success: true, message: data.message, count: data.count };
      }
      return { success: false, message: data.error || 'Import failed' };
    } catch (e) {
      return { success: false, message: 'Network error or server unavailable' };
    }
  };

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (isEditing) {
      const saveInterval = setInterval(() => {
        localStorage.setItem('tds_deductor_draft', JSON.stringify(currentDeductor));
      }, 30000);
      return () => clearInterval(saveInterval);
    }
  }, [isEditing, currentDeductor]);

  // Restore draft when entering add mode
  useEffect(() => {
    if (isEditing && !currentDeductor.id) {
      const draft = localStorage.getItem('tds_deductor_draft');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          // Only restore if the draft is a new entry (no ID) to prevent mixing edit drafts
          if (!parsed.id) {
            setCurrentDeductor(parsed);
          }
        } catch (e) {
          console.error("Failed to restore deductor draft", e);
        }
      }
    }
  }, [isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDeductor = {
      ...currentDeductor,
      id: currentDeductor.id || crypto.randomUUID(),
    } as Deductor;

    if (currentDeductor.id) {
      updateDeductor(newDeductor);
    } else {
      addDeductor(newDeductor);
    }

    localStorage.removeItem('tds_deductor_draft');
    setIsEditing(false);
    setCurrentDeductor({ type: EntityType.Company });
    setCopyCompanyDetails(false);
  };

  const handleEdit = (d: Deductor) => {
    setCurrentDeductor(d);
    setIsEditing(true);
    setCopyCompanyDetails(false);
  };

  const handleCancel = () => {
    localStorage.removeItem('tds_deductor_draft');
    setIsEditing(false);
  };

  const handleCopyDetails = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setCopyCompanyDetails(isChecked);
    if (isChecked) {
      setCurrentDeductor(prev => ({
        ...prev,
        rpFlat: prev.flat,
        rpBuilding: prev.building,
        rpRoad: prev.road,
        rpArea: prev.area,
        rpCity: prev.city,
        rpState: prev.state,
        rpPincode: prev.pincode,
        rpStd: prev.std,
        rpPhone: prev.phone,
        rpAltStd: prev.altStd,
        rpAltPhone: prev.altPhone,
        rpEmail: prev.email,
        rpAltEmail: prev.altEmail,
      }));
    }
  };

  const filteredDeductors = deductors.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.tan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Deductor Master</h2>
        {!isEditing && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition"
            >
              <FileUp size={18} /> Import Excel
            </button>
            <button
              onClick={() => { setIsEditing(true); setCurrentDeductor({ type: EntityType.Company }); }}
              className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition"
            >
              <Plus size={18} /> Add Deductor
            </button>
          </div>
        )}
      </div>

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Deductors Master"
        sampleUrl="/samples/sample_deductors.xlsx"
        description="Upload an Excel file containing deductor details. Download the sample to see the required format."
        onImport={handleImport}
      />

      {isEditing ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200">

          <div className="p-6 border-b border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Company / Deductor Name <span className="text-red-500">*</span></label>
                <input required value={currentDeductor.name || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, name: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">TAN <span className="text-red-500">*</span></label>
                <input required pattern="[A-Z]{4}[0-9]{5}[A-Z]{1}" placeholder="ABCD12345E" value={currentDeductor.tan || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, tan: e.target.value.toUpperCase() })} className="w-full p-2 border rounded-md uppercase bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">PAN <span className="text-red-500">*</span></label>
                <input required pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" placeholder="ABCDE1234F" value={currentDeductor.pan || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, pan: e.target.value.toUpperCase() })} className="w-full p-2 border rounded-md uppercase bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">GSTIN</label>
                <input value={currentDeductor.gstin || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, gstin: e.target.value.toUpperCase() })} className="w-full p-2 border rounded-md uppercase bg-white" />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Branch / Division <span className="text-red-500">*</span></label>
                <input required value={currentDeductor.branch || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, branch: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deductor Type <span className="text-red-500">*</span></label>
                <select required value={currentDeductor.type} onChange={e => setCurrentDeductor({ ...currentDeductor, type: e.target.value as EntityType })} className="w-full p-2 border rounded-md bg-white">
                  {Object.values(EntityType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  Income Tax Portal Password
                  <span className="text-xs font-normal text-slate-400 italic">(Optional - Used for Direct CSI Download)</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter password to save"
                  value={currentDeductor.itPassword || ''}
                  onChange={e => setCurrentDeductor({ ...currentDeductor, itPassword: e.target.value })}
                  className="w-full p-2 border rounded-md bg-white"
                />
              </div>
            </div>
          </div>

          {/* Company Details (Address) */}
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Company Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Flat / Door / Block <span className="text-red-500">*</span></label>
                <input required value={currentDeductor.flat || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, flat: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Building <span className="text-red-500">*</span></label>
                <input required value={currentDeductor.building || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, building: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Road / Street / Lane <span className="text-red-500">*</span></label>
                <input required value={currentDeductor.road || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, road: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Area / Locality <span className="text-red-500">*</span></label>
                <input required value={currentDeductor.area || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, area: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
              <div className="md:col-span-1 lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Town / District <span className="text-red-500">*</span></label>
                <input required value={currentDeductor.city || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, city: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pin <span className="text-red-500">*</span></label>
                <input required pattern="[0-9]{6}" maxLength={6} value={currentDeductor.pincode || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, pincode: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State <span className="text-red-500">*</span></label>
                <select required value={currentDeductor.state || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, state: e.target.value })} className="w-full p-2 border rounded-md bg-white">
                  <option value="">Select State</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">STD</label>
                <input value={currentDeductor.std || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, std: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
              <div className="md:col-span-1 lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                <input required value={currentDeductor.phone || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, phone: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alt STD</label>
                <input value={currentDeductor.altStd || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, altStd: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
              <div className="md:col-span-1 lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Alt Phone Number</label>
                <input value={currentDeductor.altPhone || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, altPhone: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>

              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Email ID <span className="text-red-500">*</span></label>
                <input required type="email" value={currentDeductor.email || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, email: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Alternate Email ID</label>
                <input type="email" value={currentDeductor.altEmail || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, altEmail: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
            </div>
          </div>

          {/* Responsible Person */}
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Responsible Person</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input required value={currentDeductor.responsiblePerson || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, responsiblePerson: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Designation <span className="text-red-500">*</span></label>
                <input required value={currentDeductor.responsibleDesignation || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, responsibleDesignation: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Father's Name</label>
                <input value={currentDeductor.responsibleFatherName || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, responsibleFatherName: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number <span className="text-red-500">*</span></label>
                <input required value={currentDeductor.responsibleMobile || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, responsibleMobile: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">PAN <span className="text-red-500">*</span></label>
                <input required pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" value={currentDeductor.responsiblePan || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, responsiblePan: e.target.value.toUpperCase() })} className="w-full p-2 border rounded-md uppercase bg-white" />
              </div>
            </div>
          </div>

          {/* Responsible Person Details */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Responsible Person Details</h3>
              <label className="flex items-center gap-2 text-sm text-brand-600 cursor-pointer select-none">
                <input type="checkbox" checked={copyCompanyDetails} onChange={handleCopyDetails} className="rounded text-brand-600 focus:ring-brand-500" />
                Copy Company Details
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Flat / Door / Block <span className="text-red-500">*</span></label>
                <input required value={currentDeductor.rpFlat || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, rpFlat: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Building <span className="text-red-500">*</span></label>
                <input required value={currentDeductor.rpBuilding || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, rpBuilding: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Road / Street / Lane <span className="text-red-500">*</span></label>
                <input required value={currentDeductor.rpRoad || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, rpRoad: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Area / Locality <span className="text-red-500">*</span></label>
                <input required value={currentDeductor.rpArea || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, rpArea: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
              <div className="md:col-span-1 lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Town / District <span className="text-red-500">*</span></label>
                <input required value={currentDeductor.rpCity || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, rpCity: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pin <span className="text-red-500">*</span></label>
                <input required pattern="[0-9]{6}" maxLength={6} value={currentDeductor.rpPincode || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, rpPincode: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State <span className="text-red-500">*</span></label>
                <select required value={currentDeductor.rpState || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, rpState: e.target.value })} className="w-full p-2 border rounded-md bg-white">
                  <option value="">Select State</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">STD</label>
                <input value={currentDeductor.rpStd || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, rpStd: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
              <div className="md:col-span-1 lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                <input required value={currentDeductor.rpPhone || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, rpPhone: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alt STD</label>
                <input value={currentDeductor.rpAltStd || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, rpAltStd: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
              <div className="md:col-span-1 lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Alt Phone Number</label>
                <input value={currentDeductor.rpAltPhone || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, rpAltPhone: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>

              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Email ID <span className="text-red-500">*</span></label>
                <input required type="email" value={currentDeductor.rpEmail || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, rpEmail: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Alternate Email ID</label>
                <input type="email" value={currentDeductor.rpAltEmail || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, rpAltEmail: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
              </div>
            </div>
          </div>

          {/* FVU 9.3 Compliance Flags */}
          <div className="p-6 border-b border-slate-100 bg-blue-50">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">FVU 9.3 Compliance Flags</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deductor/Collector Code <span className="text-red-500">*</span></label>
                <select required value={currentDeductor.deductorCode || 'D'} onChange={e => setCurrentDeductor({ ...currentDeductor, deductorCode: e.target.value as 'D' | 'C' })} className="w-full p-2 border rounded-md bg-white">
                  <option value="D">D - Deductor</option>
                  <option value="C">C - Collector</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  Address Change Since Last Return
                  <span className="text-red-500">*</span>
                </label>
                <select required value={currentDeductor.addressChangeFlag || 'N'} onChange={e => setCurrentDeductor({ ...currentDeductor, addressChangeFlag: e.target.value as 'Y' | 'N' })} className="w-full p-2 border rounded-md bg-white">
                  <option value="N">N - No Change</option>
                  <option value="Y">Y - Address Changed</option>
                </select>
                <p className="text-xs text-slate-600 mt-1">Mandatory disclosure in BH record (position 38)</p>
              </div>
            </div>
          </div>

          {/* Government Deductors */}
          <div className={`p-6 ${currentDeductor.type !== EntityType.Government ? 'opacity-50' : ''}`}>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">For Government Deductors {currentDeductor.type !== EntityType.Government && <span className="text-xs font-normal text-slate-500 ml-2">(Enabled only for Government type)</span>}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">PAO Code</label>
                <input disabled={currentDeductor.type !== EntityType.Government} value={currentDeductor.govPaoCode || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, govPaoCode: e.target.value })} className="w-full p-2 border rounded-md bg-white disabled:bg-slate-100 disabled:cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">PAO Registered Number</label>
                <input disabled={currentDeductor.type !== EntityType.Government} value={currentDeductor.govPaoRegNo || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, govPaoRegNo: e.target.value })} className="w-full p-2 border rounded-md bg-white disabled:bg-slate-100 disabled:cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">DDO Code</label>
                <input disabled={currentDeductor.type !== EntityType.Government} value={currentDeductor.govDdoCode || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, govDdoCode: e.target.value })} className="w-full p-2 border rounded-md bg-white disabled:bg-slate-100 disabled:cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">DDO Registered Number</label>
                <input disabled={currentDeductor.type !== EntityType.Government} value={currentDeductor.govDdoRegNo || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, govDdoRegNo: e.target.value })} className="w-full p-2 border rounded-md bg-white disabled:bg-slate-100 disabled:cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                <select disabled={currentDeductor.type !== EntityType.Government} value={currentDeductor.govState || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, govState: e.target.value })} className="w-full p-2 border rounded-md bg-white disabled:bg-slate-100 disabled:cursor-not-allowed">
                  <option value="">Select State</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ministry</label>
                <select disabled={currentDeductor.type !== EntityType.Government} value={currentDeductor.govMinistry || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, govMinistry: e.target.value })} className="w-full p-2 border rounded-md bg-white disabled:bg-slate-100 disabled:cursor-not-allowed">
                  <option value="">Select Ministry</option>
                  {MINISTRIES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Other Ministry</label>
                <input disabled={currentDeductor.type !== EntityType.Government || currentDeductor.govMinistry !== 'Other'} value={currentDeductor.govOtherMinistry || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, govOtherMinistry: e.target.value })} className="w-full p-2 border rounded-md bg-white disabled:bg-slate-100 disabled:cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">AIN</label>
                <input disabled={currentDeductor.type !== EntityType.Government} value={currentDeductor.govAin || ''} onChange={e => setCurrentDeductor({ ...currentDeductor, govAin: e.target.value })} className="w-full p-2 border rounded-md bg-white disabled:bg-slate-100 disabled:cursor-not-allowed" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 rounded-b-xl border-t border-slate-200 flex justify-end gap-3">
            <button type="button" onClick={handleCancel} className="px-6 py-2 border border-slate-300 rounded-md hover:bg-white text-slate-700 bg-white">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium">Save Details</button>
          </div>
        </form>
      ) : (
        <>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by Name or TAN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeductors.map(d => (
              <div key={d.id} className={`bg-white p-5 rounded-xl border shadow-sm transition-all hover:shadow-md ${activeDeductorId === d.id ? 'ring-2 ring-brand-500 border-brand-500' : 'border-slate-200'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
                      <Building size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{d.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">TAN: {d.tan}</p>
                    </div>
                  </div>
                  <button onClick={() => handleEdit(d)} className="text-slate-400 hover:text-brand-600"><Edit2 size={16} /></button>
                </div>

                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  <div className="flex items-center gap-2"><User size={14} /> {d.responsiblePerson}</div>
                  <div className="flex items-center gap-2"><MapPin size={14} /> {d.city}, {d.state}</div>
                  <div className="flex items-center gap-2"><Mail size={14} /> {d.email}</div>
                  <div className="flex items-center gap-2"><Phone size={14} /> {d.phone}</div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveDeductor(d.id)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${activeDeductorId === d.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    {activeDeductorId === d.id ? 'Active Business' : 'Switch to This'}
                  </button>
                </div>
              </div>
            ))}
            {filteredDeductors.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p>{deductors.length === 0 ? "No deductors found. Add your first business to get started." : "No matching deductors found."}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export const DeducteeManager: React.FC = () => {
  const { deductees, addDeductee, updateDeductee, activeDeductorId, refreshData } = useTds();
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<Partial<Deductee>>({ code: '02' });
  const [showImportModal, setShowImportModal] = useState(false);

  const handleImport = async (file: File) => {
    if (!activeDeductorId) return { success: false, message: 'No active deductor selected' };

    const formData = new FormData();
    formData.append('file', file);
    formData.append('deductorId', activeDeductorId);

    try {
      const res = await fetch('/api/import/deductees', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        await refreshData();
        return { success: true, message: data.message, count: data.count };
      }
      return { success: false, message: data.error || 'Import failed' };
    } catch (e) {
      return { success: false, message: 'Network error or server unavailable' };
    }
  };

  // Filter deductees for current deductor only
  const myDeductees = deductees.filter(d => d.deductorId === activeDeductorId);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (isEditing) {
      const saveInterval = setInterval(() => {
        localStorage.setItem('tds_deductee_draft', JSON.stringify(current));
      }, 30000);
      return () => clearInterval(saveInterval);
    }
  }, [isEditing, current]);

  // Restore draft when entering add mode
  useEffect(() => {
    if (isEditing && !current.id) {
      const draft = localStorage.getItem('tds_deductee_draft');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (!parsed.id) {
            setCurrent(parsed);
          }
        } catch (e) {
          console.error("Failed to restore deductee draft", e);
        }
      }
    }
  }, [isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeductorId) return;

    const newRec = {
      ...current,
      deductorId: activeDeductorId,
      id: current.id || crypto.randomUUID(),
    } as Deductee;

    if (current.id) updateDeductee(newRec);
    else addDeductee(newRec);

    localStorage.removeItem('tds_deductee_draft');
    setIsEditing(false);
    setCurrent({ code: '02' });
  };

  const handleCancel = () => {
    localStorage.removeItem('tds_deductee_draft');
    setIsEditing(false);
    setCurrent({ code: '02' });
  };

  if (!activeDeductorId) return <div className="p-8 text-center text-slate-500">Please select a Deductor from the dashboard or sidebar first.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Deductee Master</h2>
          <p className="text-sm text-slate-600 mt-1">At least one deductee/collectee record is required per Income Tax Department guidelines</p>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition"
            >
              <FileUp size={18} /> Import Excel
            </button>
          )}
          <button
            onClick={() => { setIsEditing(true); setCurrent({ code: '02' }); }}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition"
          >
            <Plus size={18} /> Add Deductee
          </button>
        </div>
      </div>

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Deductees Master"
        sampleUrl="/samples/sample_deductees.xlsx"
        description="Import deductees for the currently active business. Records will be mapped using their PAN."
        onImport={handleImport}
      />

      {myDeductees.length === 0 && !isEditing && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">No deductees configured</p>
            <p>You need to add at least one deductee/collectee record to generate TDS returns. Click "Add Deductee" to proceed.</p>
          </div>
        </div>
      )}

      {isEditing && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="col-span-2 text-lg font-semibold text-brand-600 mb-2">Deductee Details</div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">PAN <span className="text-red-500">*</span></label>
            <input required pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" placeholder="ABCDE1234F" value={current.pan || ''} onChange={e => setCurrent({ ...current, pan: e.target.value.toUpperCase() })} className="w-full p-2 border rounded-md uppercase bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name <span className="text-red-500">*</span></label>
            <input required value={current.name || ''} onChange={e => setCurrent({ ...current, name: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deductee Code <span className="text-red-500">*</span></label>
            <select required value={current.code} onChange={e => setCurrent({ ...current, code: e.target.value as any })} className="w-full p-2 border rounded-md bg-white">
              <option value="">Select Code</option>
              <option value="01">01 - Company</option>
              <option value="02">02 - Other than Company</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deductee Status</label>
            <select value={current.deducteeStatus || 'O'} onChange={e => setCurrent({ ...current, deducteeStatus: e.target.value as any })} className="w-full p-2 border rounded-md bg-white">
              <option value="O">O - Ordinary</option>
              <option value="A">A - Alternate</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Buyer/Seller Flag</label>
            <select value={current.buyerSellerFlag || '2'} onChange={e => setCurrent({ ...current, buyerSellerFlag: e.target.value as any })} className="w-full p-2 border rounded-md bg-white">
              <option value="1">1 - Buyer</option>
              <option value="2">2 - Seller</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email (Optional)</label>
            <input type="email" value={current.email || ''} onChange={e => setCurrent({ ...current, email: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mobile (Optional)</label>
            <input value={current.mobile || ''} onChange={e => setCurrent({ ...current, mobile: e.target.value })} className="w-full p-2 border rounded-md bg-white" />
          </div>
          <div className="col-span-2 flex justify-end gap-3 mt-4">
            <button type="button" onClick={handleCancel} className="px-4 py-2 border rounded-md hover:bg-slate-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700">Save Deductee</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="p-4">PAN</th>
              <th className="p-4">Name</th>
              <th className="p-4">Type</th>
              <th className="p-4">Contact</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {myDeductees.map(d => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="p-4 font-mono text-slate-600">{d.pan}</td>
                <td className="p-4 font-medium text-slate-800">{d.name}</td>
                <td className="p-4 text-slate-600">{d.code === '01' ? 'Company' : 'Non-Company'}</td>
                <td className="p-4 text-slate-600">{d.mobile || '-'}</td>
                <td className="p-4 text-right">
                  <button onClick={() => { setCurrent(d); setIsEditing(true); }} className="text-brand-600 hover:text-brand-800 font-medium">Edit</button>
                </td>
              </tr>
            ))}
            {myDeductees.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">No deductees added yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
