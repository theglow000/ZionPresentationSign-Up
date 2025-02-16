import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronRight, X } from 'lucide-react';
import stringSimilarity from 'string-similarity';

// Add after the imports and before the component:
const liturgicalTerms = {
  songs: [
    'Kyrie',
    'Alleluia',
    'Gospel Acclamation',
    'Canticle',
    'Create in Me',
    'Change My Heart O God',
    'Lamb of God',
    'Glory to God',
    'This is the Feast'
  ],
  readings: [
    'First Reading',
    'Second Reading',
    'Gospel Reading',
    'Psalm Reading'
  ],
  liturgy: [
    'Confession and Forgiveness',
    'Apostle\'s Creed',
    'Prayer of the Day',
    'Blessing',
    'Peace',
    'Offering',
    'Communion',
    'Distribution',
    'Prelude',
    'Postlude',
    'Dismissal',
    'Greeting',
    'Announcements'
  ]
};

// Add this helper function before the component
const findClosestMatch = (word, dictionary) => {
  // First check if the input contains any exact dictionary term
  const exactMatch = dictionary.find(
    term => word.toLowerCase().includes(term.toLowerCase())
  );
  if (exactMatch) {
    return null; // No suggestion needed if it contains a valid term
  }

  // For multi-word input, only suggest if it's very similar to a dictionary term
  const matches = stringSimilarity.findBestMatch(
    word.toLowerCase(),
    dictionary.map(term => term.toLowerCase())
  );

  // Higher threshold for multi-word phrases
  const threshold = word.includes(' ') ? 0.8 : 0.6;

  if (matches.bestMatch.rating > threshold) {
    return {
      original: word,
      suggestion: dictionary[matches.bestMatchIndex],
      rating: matches.bestMatch.rating
    };
  }
  return null;
};

const AddCustomService = ({
  existingService = null,
  onClose,
  onSave,
  setSelectedType,
  setIsCustomService,
  setOrderOfWorship,
  setHasExistingContent,
  setCustomServices
}) => {
  const isEditMode = !!existingService;
  const [step, setStep] = useState('input');
  const [serviceName, setServiceName] = useState(existingService?.name || '');
  const [rawOrder, setRawOrder] = useState(
    existingService?.order || existingService?.template || ''
  );
  const [parsedElements, setParsedElements] = useState(
    existingService?.elements?.map(el => ({
      ...el,
      type: el.type || 'liturgy'
    })) || []
  );
  const [isSaving, setIsSaving] = useState(false);

  const parseOrderOfWorship = (text) => {
    const lines = text.split('\n').filter(line => line.trim());

    return lines.map(line => {
      let type = 'liturgy';
      const lowerLine = line.toLowerCase().trim();
      let suggestion = null;

      // Check for misspellings in each category
      let match = findClosestMatch(line, liturgicalTerms.songs);
      if (match) {
        type = 'liturgical_song';
        suggestion = match.suggestion;
      } else {
        match = findClosestMatch(line, liturgicalTerms.readings);
        if (match) {
          type = 'reading';
          suggestion = match.suggestion;
        } else {
          match = findClosestMatch(line, liturgicalTerms.liturgy);
          if (match) {
            type = 'liturgy';
            suggestion = match.suggestion;
          }
        }
      }

      // Hymns/Songs - check for common patterns
      if (lowerLine.includes('hymn') ||
        lowerLine.includes('song') ||
        lowerLine.includes('opening') ||
        lowerLine.endsWith(':') ||
        lowerLine.includes('sending')) {
        type = 'song_hymn';
      }

      // Liturgical songs - specific matches
      else if (
        lowerLine.includes('kyrie') ||
        lowerLine.includes('alleluia') ||
        lowerLine.includes('acclamation') ||
        lowerLine.includes('canticle') ||  // Add canticle detection
        lowerLine.includes('create in me') ||
        lowerLine.includes('change my heart') ||
        lowerLine.includes('lamb of god') ||
        lowerLine.includes('glory to god') ||
        lowerLine.includes('this is the feast')
      ) {
        type = 'liturgical_song';
      }

      // Readings - look for common patterns
      else if (
        lowerLine.includes('reading') ||
        lowerLine.includes('psalm') ||
        (lowerLine.includes('gospel') && !lowerLine.includes('acclamation')) ||
        lowerLine.includes('lesson') ||
        lowerLine.includes('scripture')
      ) {
        type = 'reading';
      }

      // Message/Sermon related
      else if (
        lowerLine.includes('sermon') ||
        lowerLine.includes('message') ||
        lowerLine.includes('homily') ||
        lowerLine.includes("children's")
      ) {
        type = 'message';
      }

      // Common liturgical elements
      else if (
        lowerLine.includes('confession') ||
        lowerLine.includes('creed') ||
        lowerLine.includes('prayer') ||
        lowerLine.includes('blessing') ||
        lowerLine.includes('peace') ||
        lowerLine.includes('offering') ||
        lowerLine.includes('communion') ||
        lowerLine.includes('distribution') ||
        lowerLine.includes('prelude') ||
        lowerLine.includes('postlude') ||
        lowerLine.includes('dismissal') ||
        lowerLine.includes('greeting') ||
        lowerLine.includes('announcements')
      ) {
        type = 'liturgy';
      }

      return {
        type,
        content: line,
        reference: '',
        note: '',
        suggestion: suggestion
      };
    });
  };

  const ElementTypeSelect = ({ element, index, onChange }) => (
    <div className="flex flex-col gap-1">
      <select
        value={element.type}
        onChange={(e) => onChange(index, { ...element, type: e.target.value })}
        className="p-1 border rounded text-black"
      >
        <option value="liturgy">Liturgy</option>
        <option value="song_hymn">Song/Hymn (Needs Selection)</option>
        <option value="liturgical_song">Liturgical Song</option>
        <option value="reading">Reading</option>
        <option value="message">Message</option>
      </select>
      {element.suggestion && (
        <div className="text-xs text-[#6B8E23] bg-[#FFD700] bg-opacity-10 p-1 rounded">
          Did you mean:
          <button
            onClick={() => onChange(index, {
              ...element,
              content: element.suggestion,
              suggestion: null
            })}
            className="ml-1 underline hover:text-[#556B2F]"
          >
            {element.suggestion}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl bg-white rounded-lg shadow-xl">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-[#6B8E23]">
              {isEditMode ? 'Edit' : 'Add'} Custom Service
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-[#6B8E23] hover:bg-[#6B8E23] hover:bg-opacity-20 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {step === 'input' ? (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-lg font-bold text-[#6B8E23] mb-2">
                Service Name
              </label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g., Good Friday"
                className="w-full p-3 border rounded text-black hover:border-[#6B8E23] focus:border-[#6B8E23] focus:ring-1 focus:ring-[#6B8E23]"
              />
            </div>

            <div>
              <label className="block text-lg font-bold text-[#6B8E23] mb-2">
                Order of Worship
              </label>
              <textarea
                value={rawOrder}
                onChange={(e) => setRawOrder(e.target.value)}
                placeholder="Paste the Order of Worship..."
                className="w-full h-64 p-3 border rounded font-mono text-sm text-black resize-none hover:border-[#6B8E23] focus:border-[#6B8E23] focus:ring-1 focus:ring-[#6B8E23]"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  console.log('Review button clicked');
                  console.log('Service Name:', serviceName);
                  console.log('Raw Order:', rawOrder);

                  if (serviceName && rawOrder) {
                    const elements = parseOrderOfWorship(rawOrder);
                    console.log('Parsed Elements:', elements);
                    setParsedElements(elements);
                    setStep('review');
                  } else {
                    console.log('Missing required fields');
                  }
                }}
                disabled={!serviceName || !rawOrder}
                className="flex items-center gap-2 px-4 py-2 rounded bg-[#6B8E23] text-white hover:bg-[#556B2F] disabled:bg-gray-200 disabled:text-gray-500"
              >
                Review Elements
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <h3 className="text-lg font-bold text-[#6B8E23] mb-4">Review Service Elements</h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {parsedElements.map((element, index) => (
                <div key={index} className="flex items-start gap-3 p-2 border rounded">
                  <ElementTypeSelect
                    element={element}
                    index={index}
                    onChange={(idx, updated) => {
                      const newElements = [...parsedElements];
                      newElements[idx] = updated;
                      setParsedElements(newElements);
                    }}
                  />
                  <div className="flex-1">
                    <input
                      value={element.content}
                      onChange={(e) => {
                        const newElements = [...parsedElements];
                        newElements[index] = { ...element, content: e.target.value };
                        setParsedElements(newElements);
                      }}
                      className="w-full p-1 border rounded text-sm text-black hover:border-[#6B8E23] focus:border-[#6B8E23] focus:ring-1 focus:ring-[#6B8E23]"
                    />
                    {(element.reference || element.type === 'hymn' || element.type === 'reading') && (
                      <input
                        value={element.reference}
                        onChange={(e) => {
                          const newElements = [...parsedElements];
                          newElements[index] = { ...element, reference: e.target.value };
                          setParsedElements(newElements);
                        }}
                        placeholder="Reference (e.g., hymn number or Bible verse)"
                        className="w-full mt-1 p-1 border rounded text-xs text-black hover:border-[#6B8E23] focus:border-[#6B8E23] focus:ring-1 focus:ring-[#6B8E23]"
                      />
                    )}
                    {element.note && (
                      <input
                        value={element.note}
                        onChange={(e) => {
                          const newElements = [...parsedElements];
                          newElements[index] = { ...element, note: e.target.value };
                          setParsedElements(newElements);
                        }}
                        placeholder="Notes"
                        className="w-full mt-1 p-1 border rounded text-xs text-black hover:border-[#6B8E23] focus:border-[#6B8E23] focus:ring-1 focus:ring-[#6B8E23]"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t bg-[#FFD700] bg-opacity-10 flex justify-between">
          {step === 'review' && (
            <button
              onClick={() => setStep('input')}
              className="px-4 py-2 border border-[#6B8E23] text-[#6B8E23] rounded hover:bg-[#6B8E23] hover:text-white"
            >
              Back to Edit
            </button>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#6B8E23] text-[#6B8E23] rounded hover:bg-[#6B8E23] hover:text-white"
            >
              Cancel
            </button>
            {step === 'review' && (
              <button
                onClick={async () => {
                  setIsSaving(true);
                  const serviceData = {
                    id: existingService?.id || `service_${Date.now()}`,
                    name: serviceName.trim(),
                    elements: parsedElements.map(el => ({
                      ...el,
                      type: el.type || 'liturgy',
                      content: el.content.trim(),
                      // Ensure we preserve any reference, note, and suggestion data
                      reference: el.reference || '',
                      note: el.note || '',
                      suggestion: null // Clear suggestions after saving
                    })),
                    order: rawOrder.trim(),
                    template: parsedElements.map(el => el.content.trim()).join('\n')
                  };

                  try {
                    console.log('Saving custom service:', serviceData);
                    const method = existingService ? 'PUT' : 'POST';
                    const response = await fetch('/api/custom-services', {
                      method,
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(serviceData),
                    });

                    if (response.ok) {
                      const savedService = await response.json();

                      // First update custom services
                      const updatedServices = await fetch('/api/custom-services').then(res => res.json());
                      await setCustomServices(updatedServices);

                      // Then update other states synchronously
                      setIsCustomService(true);
                      setSelectedType(serviceData.id);
                      setOrderOfWorship(serviceData.order);
                      setHasExistingContent(false);

                      // Finally close the modal
                      onClose();
                    }
                  } catch (error) {
                    console.error('Error saving custom service:', error);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
                className="px-4 py-2 bg-[#6B8E23] text-white rounded hover:bg-[#556B2F] disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Custom Service'}
              </button>
            )}
          </div>
        </div>
      </Card >
    </div >
  );
};

export default AddCustomService;