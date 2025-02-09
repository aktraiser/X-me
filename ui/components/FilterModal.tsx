import { Expert, Location } from "@/types";
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Transition } from "@headlessui/react";
import { Fragment } from "react";

interface Expertise {
  id: string;
  name: string;
}

interface FilterProps {
  selectedPays: string;
  setSelectedPays: (pays: string) => void;
  selectedVille: string;
  setSelectedVille: (ville: string) => void;
  selectedExpertises: string[];
  setSelectedExpertises: Dispatch<SetStateAction<string[]>>;
  locations: Location[];
  experts: Expert[] | null;
  isOpen: boolean;
  onClose: () => void;
}

// Composant mobile
const MobileFilterModal = ({
  selectedPays,
  setSelectedPays,
  selectedVille,
  setSelectedVille,
  selectedExpertises,
  setSelectedExpertises,
  locations,
  experts,
  isOpen,
  onClose
}: FilterProps) => {
  const expertises: Expertise[] = [
    { id: 'immobilier', name: 'Immobilier' },
    { id: 'finance', name: 'Finance' },
    { id: 'droit', name: 'Droit' },
    { id: 'fiscalite', name: 'Fiscalité' },
    { id: 'assurance', name: 'Assurance' },
    { id: 'patrimoine', name: 'Patrimoine' },
  ];

  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <div className="fixed inset-0 z-50 md:hidden">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80" aria-hidden="true" />
        </Transition.Child>

        <Transition.Child
          as={Fragment}
          enter="transform transition ease-in-out duration-300"
          enterFrom="translate-y-full"
          enterTo="translate-y-0"
          leave="transform transition ease-in-out duration-300"
          leaveFrom="translate-y-0"
          leaveTo="translate-y-full"
        >
          <div className="fixed inset-0 bg-[#1B2631] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Filtres</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 hover:bg-gray-700/50"
              >
                <X className="h-4 w-4 text-white" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3 text-gray-400">Investment vehicle</h3>
                <div className="space-y-2">
                  {expertises.map((expertise) => (
                    <label
                      key={expertise.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedExpertises.includes(expertise.id)}
                        onChange={() => setSelectedExpertises(prev =>
                          prev.includes(expertise.id)
                            ? prev.filter(id => id !== expertise.id)
                            : [...prev, expertise.id]
                        )}
                        className="rounded border-gray-600 bg-transparent text-blue-500 focus:ring-blue-500 focus:ring-offset-[#1B2631]"
                      />
                      <span className="text-sm text-white">{expertise.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3 text-gray-400">Company</h3>
                <div className="space-y-2">
                  {locations.map(({ pays }) => (
                    <label
                      key={pays}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="pays"
                        checked={selectedPays === pays}
                        onChange={() => setSelectedPays(selectedPays === pays ? '' : pays)}
                        className="rounded-full border-gray-600 bg-transparent text-blue-500 focus:ring-blue-500 focus:ring-offset-[#1B2631]"
                      />
                      <span className="text-sm text-white">{pays}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedPays && (
                <div>
                  <h3 className="text-sm font-medium mb-3 text-gray-400">Villes {selectedPays && `(${selectedPays})`}</h3>
                  <div className="space-y-2">
                    {locations
                      .find(loc => loc.pays === selectedPays)
                      ?.villes.map(ville => (
                        <label
                          key={ville}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="ville"
                            checked={selectedVille === ville}
                            onChange={() => setSelectedVille(selectedVille === ville ? '' : ville)}
                            className="rounded-full border-gray-600 bg-transparent text-blue-500 focus:ring-blue-500 focus:ring-offset-[#1B2631]"
                          />
                          <span className="text-sm text-white">{ville}</span>
                        </label>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-700 flex justify-between bg-[#1B2631]">
              <button
                onClick={() => {
                  setSelectedPays('');
                  setSelectedVille('');
                  setSelectedExpertises([]);
                }}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Clear all
              </button>
              <button
                onClick={onClose}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Appliquer
              </button>
            </div>
          </div>
        </Transition.Child>
      </div>
    </Transition>
  );
};

// Composant desktop
const DesktopFilterDropdown = ({
  selectedPays,
  setSelectedPays,
  selectedVille,
  setSelectedVille,
  selectedExpertises,
  setSelectedExpertises,
  locations,
  experts,
  isOpen,
  onClose
}: FilterProps) => {
  const expertises: Expertise[] = [
    { id: 'immobilier', name: 'Immobilier' },
    { id: 'finance', name: 'Finance' },
    { id: 'droit', name: 'Droit' },
    { id: 'fiscalite', name: 'Fiscalité' },
    { id: 'assurance', name: 'Assurance' },
    { id: 'patrimoine', name: 'Patrimoine' },
  ];

  if (!isOpen) return null;

  return (
    <div className="hidden md:block absolute top-full right-0 mt-2 w-[320px]">
      <div className="bg-light-secondary dark:bg-[#1B2631] rounded-lg shadow-lg">
        <div className="p-4 space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-3 text-gray-400">Investment vehicle</h3>
            <div className="space-y-2">
              {expertises.map((expertise) => (
                <label
                  key={expertise.id}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedExpertises.includes(expertise.id)}
                    onChange={() => setSelectedExpertises(prev =>
                      prev.includes(expertise.id)
                        ? prev.filter(id => id !== expertise.id)
                        : [...prev, expertise.id]
                    )}
                    className="rounded border-gray-600 bg-transparent text-blue-500 focus:ring-blue-500 focus:ring-offset-[#1B2631]"
                  />
                  <span className="text-sm text-white">{expertise.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3 text-gray-400">Company</h3>
            <div className="space-y-2">
              {locations.map(({ pays }) => (
                <label
                  key={pays}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="pays"
                    checked={selectedPays === pays}
                    onChange={() => setSelectedPays(selectedPays === pays ? '' : pays)}
                    className="rounded-full border-gray-600 bg-transparent text-blue-500 focus:ring-blue-500 focus:ring-offset-[#1B2631]"
                  />
                  <span className="text-sm text-white">{pays}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedPays && (
            <div>
              <h3 className="text-sm font-medium mb-3 text-gray-400">Villes {selectedPays && `(${selectedPays})`}</h3>
              <div className="space-y-2">
                {locations
                  .find(loc => loc.pays === selectedPays)
                  ?.villes.map(ville => (
                    <label
                      key={ville}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="ville"
                        checked={selectedVille === ville}
                        onChange={() => setSelectedVille(selectedVille === ville ? '' : ville)}
                        className="rounded-full border-gray-600 bg-transparent text-blue-500 focus:ring-blue-500 focus:ring-offset-[#1B2631]"
                      />
                      <span className="text-sm text-white">{ville}</span>
                    </label>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 flex justify-between">
          <button
            onClick={() => {
              setSelectedPays('');
              setSelectedVille('');
              setSelectedExpertises([]);
            }}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Clear all
          </button>
          <button
            onClick={onClose}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
};

// Composant principal qui gère l'affichage conditionnel
export const FilterDropdown = (props: FilterProps) => {
  return (
    <>
      <MobileFilterModal {...props} />
      <DesktopFilterDropdown {...props} />
    </>
  );
}; 
