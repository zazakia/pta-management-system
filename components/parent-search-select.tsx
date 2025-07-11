'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, User, Users, CheckCircle, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Parent {
  id: string;
  name: string;
  contact_number: string | null;
  email: string | null;
  payment_status: boolean;
  students: Array<{
    id: string;
    name: string;
    class: {
      name: string;
    };
  }>;
}

interface ParentSearchSelectProps {
  onSelect: (parent: Parent) => void;
  selectedParent: Parent | null;
}

export function ParentSearchSelect({ onSelect, selectedParent }: ParentSearchSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);
  const { data: parents, error, isLoading } = useSWR<Parent[]>('/api/parents', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
  });

  const filteredParents = useMemo(() => {
    if (!parents) return [];
    
    return parents.filter(parent =>
      parent.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      parent.contact_number?.includes(debouncedSearchTerm) ||
      parent.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [parents, debouncedSearchTerm]);

  const handleParentClick = (parent: Parent) => {
    onSelect(parent);
    setSearchTerm(parent.name);
    setShowDropdown(false);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    if (e.target.value === '' && selectedParent) {
      onSelect(null as any);
    }
  };

  useEffect(() => {
    if (selectedParent) {
      setSearchTerm(selectedParent.name);
    }
  }, [selectedParent]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className="pl-10"
        />
      </div>

      {showDropdown && (
        <Card className="absolute z-10 w-full mt-1 max-h-64 overflow-y-auto">
          <CardContent className="p-0">
            {isLoading && (
              <div className="p-4 text-center text-gray-500">
                Loading parents...
              </div>
            )}
            
            {error && (
              <div className="p-4 text-center text-red-500">
                Error loading parents
              </div>
            )}

            {!isLoading && !error && filteredParents.length === 0 && searchTerm && (
              <div className="p-4 text-center text-gray-500">
                No parents found matching "{searchTerm}"
              </div>
            )}

            {!isLoading && !error && searchTerm === '' && (
              <div className="p-4 text-center text-gray-500">
                Type to search for a parent/guardian
              </div>
            )}

            {filteredParents.slice(0, 10).map((parent) => (
              <div
                key={parent.id}
                onClick={() => handleParentClick(parent)}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">
                          {parent.name}
                        </p>
                        {parent.payment_status ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      
                      {parent.contact_number && (
                        <p className="text-sm text-gray-600">
                          📞 {parent.contact_number}
                        </p>
                      )}
                      
                      {parent.email && (
                        <p className="text-sm text-gray-600">
                          ✉️ {parent.email}
                        </p>
                      )}
                      
                      {parent.students && parent.students.length > 0 && (
                        <div className="flex items-center mt-1">
                          <Users className="h-3 w-3 text-gray-400 mr-1" />
                          <p className="text-xs text-gray-500">
                            {parent.students.length} student{parent.students.length !== 1 ? 's' : ''}: {' '}
                            {parent.students.map(s => s.name).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      parent.payment_status 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {parent.payment_status ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}