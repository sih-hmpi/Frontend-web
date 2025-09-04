import React, { useMemo, useEffect, useState } from 'react';
import { 
  useTable, 
  usePagination, 
  useGlobalFilter, 
  useFilters, 
  useSortBy, 
  Column 
} from 'react-table';
import { transformTableData } from './utils/transformData';
import jsonData from './dataa.json';  // Assuming the JSON file is named dataa.json and placed in the same directory; adjust path if needed

// Define TypeScript interface for your data
interface WaterQualityData {
  'S. No.': number;
  'State': string;
  'District': string;
  'Location': string;
  'Longitude': number | string;
  'Latitude': number | string;
  'Year': number;
  'pH': number;
  'EC (µS/cm at 25 °C)': number;
  'CO3 (mg/L)': number;
  'HCO3 (mg/L)': number;
  'Cl (mg/L)': number;
  'F (mg/L)': number;
  'SO4 (mg/L)': number;
  'NO3 (mg/L)': number;
  'PO4 (mg/L)': number;
  'Total Hardness (mg/L)': number;
  'Ca (mg/L)': number;
  'Mg (mg/L)': number;
  'Na (mg/L)': number;
  'K (mg/L)': number;
  'Fe (ppm)': number;
  'As (ppb)': number;
  'U (ppb)': number;
}

interface FilterProps {
  column: {
    filterValue: string;
    setFilter: (filterValue: string | undefined) => void;
    preFilteredRows: any[];
    id: string;
  }
}

const SelectColumnFilter: React.FC<FilterProps> = ({
  column: { filterValue, setFilter, preFilteredRows, id }
}) => {
  const options = useMemo(() => {
    const optionSet = new Set<string>();
    preFilteredRows.forEach(row => {
      optionSet.add(row.values[id]);
    });
    return [...optionSet.values()];
  }, [id, preFilteredRows]);

  return (
    <select
      value={filterValue || ''}
      onChange={e => setFilter(e.target.value || undefined)}
    >
      <option value="">All</option>
      {options.map((option, i) => (
        <option key={i} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};

const WaterQualityTable: React.FC = () => {
  const [data, setData] = useState<WaterQualityData[]>([]);

  useEffect(() => {
    try {
      const transformedData = transformTableData(jsonData);
      setData(transformedData);
    } catch (error) {
      console.error('Error transforming data:', error);
    }
  }, []);

  const columns = useMemo<Column<WaterQualityData>[]>(
    () => [
      { 
        Header: 'S. No.',
        accessor: 'S. No.',
        Cell: ({ value }) => value ?? '-'
      },
      { 
        Header: 'State',
        accessor: 'State',
        Filter: SelectColumnFilter,
        filter: 'includes',
        Cell: ({ value }) => value ?? '-'
      },
      { 
        Header: 'District',
        accessor: 'District',
        Filter: SelectColumnFilter,
        filter: 'includes',
        Cell: ({ value }) => value ?? '-'
      },
      { 
        Header: 'Location',
        accessor: 'Location',
        Cell: ({ value }) => value ?? '-'
      },
      { 
        Header: 'Longitude',
        accessor: 'Longitude',
        Cell: ({ value }) => value ?? '-'
      },
      { 
        Header: 'Latitude',
        accessor: 'Latitude',
        Cell: ({ value }) => value ?? '-'
      },
      { 
        Header: 'Year',
        accessor: 'Year',
        Cell: ({ value }) => value ?? '-'
      },
      { 
        Header: 'pH',
        accessor: 'pH',
        Cell: ({ value }) => value?.toFixed(2) ?? '-'
      },
      { 
        Header: 'EC (µS/cm at 25 °C)',
        accessor: 'EC (µS/cm at 25 °C)',
        Cell: ({ value }) => value ?? '-'
      },
      { 
        Header: 'CO3 (mg/L)',
        accessor: 'CO3 (mg/L)',
        Cell: ({ value }) => value ?? '-'
      },
      { 
        Header: 'HCO3 (mg/L)',
        accessor: 'HCO3 (mg/L)',
        Cell: ({ value }) => value ?? '-'
      },
      { 
        Header: 'Cl (mg/L)',
        accessor: 'Cl (mg/L)',
        Cell: ({ value }) => value ?? '-'
      },
      { 
        Header: 'F (mg/L)',
        accessor: 'F (mg/L)',
        Cell: ({ value }) => value?.toFixed(2) ?? '-'
      },
      { 
        Header: 'SO4 (mg/L)',
        accessor: 'SO4 (mg/L)',
        Cell: ({ value }) => value ?? '-'
      },
      { 
        Header: 'NO3 (mg/L)',
        accessor: 'NO3 (mg/L)',
        Cell: ({ value }) => value ?? '-'
      },
      { 
        Header: 'PO4 (mg/L)',
        accessor: 'PO4 (mg/L)',
        Cell: ({ value }) => value?.toFixed(2) ?? '-'
      },
      { 
        Header: 'Total Hardness (mg/L)',
        accessor: 'Total Hardness (mg/L)',
        Cell: ({ value }) => value ?? '-'
      },
      { 
        Header: 'Ca (mg/L)',
        accessor: 'Ca (mg/L)',
        Cell: ({ value }) => value ?? '-'
      },
      { 
        Header: 'Mg (mg/L)',
        accessor: 'Mg (mg/L)',
        Cell: ({ value }) => value ?? '-'
      },
      { 
        Header: 'Na (mg/L)',
        accessor: 'Na (mg/L)',
        Cell: ({ value }) => value ?? '-'
      },
      { 
        Header: 'K (mg/L)',
        accessor: 'K (mg/L)',
        Cell: ({ value }) => value ?? '-'
      },
      { 
        Header: 'Fe (ppm)',
        accessor: 'Fe (ppm)',
        Cell: ({ value }) => value?.toFixed(2) ?? '-'
      },
      { 
        Header: 'As (ppb)',
        accessor: 'As (ppb)',
        Cell: ({ value }) => value?.toFixed(2) ?? '-'
      },
      { 
        Header: 'U (ppb)',
        accessor: 'U (ppb)',
        Cell: ({ value }) => value?.toFixed(3) ?? '-'
      }
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize, globalFilter },
    setGlobalFilter,
  } = useTable<WaterQualityData>(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  return (
    <div>
      {/* Global Search Filter */}
      <input
        value={globalFilter || ''}
        onChange={e => setGlobalFilter(e.target.value)}
        placeholder="Search all columns..."
        className="mb-4 p-2 border border-gray-300 rounded w-full"
      />
      <div className="overflow-x-auto">
        <table {...getTableProps()} className="min-w-full bg-white border border-gray-300">
          <thead>
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()} className="bg-gray-100">
                {headerGroup.headers.map(column => (
                  <th 
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    className="px-4 py-2 text-left text-sm font-semibold text-gray-600 border-b"
                  >
                    {column.render('Header')}
                    <span>{column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}</span>
                    <div>{column.canFilter ? column.render('Filter') : null}</div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map(row => {
              prepareRow(row);
              return (
                <tr 
                  {...row.getRowProps()}
                  className="hover:bg-gray-50"
                >
                  {row.cells.map(cell => (
                    <td 
                      {...cell.getCellProps()}
                      className="px-4 py-2 border-b text-sm text-gray-900"
                    >
                      {cell.render('Cell')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Pagination Controls */}
      <div className="mt-4 flex items-center justify-between">
        <div>
          <button 
            onClick={() => gotoPage(0)} 
            disabled={!canPreviousPage}
            className="px-2 py-1 border rounded mr-2 disabled:opacity-50"
          >
            {'<<'}
          </button>
          <button 
            onClick={() => previousPage()} 
            disabled={!canPreviousPage}
            className="px-2 py-1 border rounded mr-2 disabled:opacity-50"
          >
            {'<'}
          </button>
          <button 
            onClick={() => nextPage()} 
            disabled={!canNextPage}
            className="px-2 py-1 border rounded mr-2 disabled:opacity-50"
          >
            {'>'}
          </button>
          <button 
            onClick={() => gotoPage(pageCount - 1)} 
            disabled={!canNextPage}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            {'>>'}
          </button>
        </div>
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{' '}
        </span>
        <span>
          | Go to page:{' '}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              gotoPage(page);
            }}
            className="p-1 border rounded w-16"
          />
        </span>
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value));
          }}
          className="p-1 border rounded"
        >
          {[10, 20, 30, 40, 50].map(size => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default WaterQualityTable;