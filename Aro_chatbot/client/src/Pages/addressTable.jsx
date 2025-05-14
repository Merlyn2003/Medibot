import React, { useState, useEffect } from "react";
import Navbar from "../Components/Navbar/Navbar";

const AddressTable = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const overpassQuery = `[out:json];(
      node["amenity"~"hospital|clinic|doctors"](around:5000,13.0827,80.2707);
      way["amenity"~"hospital|clinic|doctors"](around:5000,13.0827,80.2707);
      relation["amenity"~"hospital|clinic|doctors"](around:5000,13.0827,80.2707);
    );out center;`;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Network response was not ok (${res.status})`);
        return res.json();
      })
      .then((data) => {
        const parsed = data.elements.map((el) => {
          const tags = el.tags || {};
          const addressParts = [tags["addr:street"], tags["addr:district"], tags["addr:city"]]
            .filter(Boolean)
            .join(", ");
          const address = tags["addr:full"] || addressParts || "Address not available";
          return {
            id: el.id,
            name: tags.name || "Unnamed",
            address: address,
            website: tags.website || null,
            postcode: tags["addr:postcode"] || "N/A",
          };
        });
        setHospitals(parsed);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
          <span className="ml-3 text-gray-700">Fetching nearby hospitals...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6 max-w-5xl mx-auto py-20">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
          Hospitals & Clinics Near You
        </h2>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Postcode
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Website
                </th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map((hospital) => (
                <tr key={hospital.id}>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{hospital.name}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900">{hospital.address}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{hospital.postcode}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">
                    {hospital.website ? (
                      <a
                        href={hospital.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
                      >
                        Visit
                      </a>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hospitals.length === 0 && !loading && !error && (
            <div className="px-5 py-5 bg-white text-center text-gray-500">
              No hospitals or clinics found nearby.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressTable;