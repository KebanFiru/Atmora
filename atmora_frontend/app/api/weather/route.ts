import { NextRequest, NextResponse } from 'next/server';

interface WeatherParams {
  longitude: number;
  latitude: number;
  startDate: string;
  endDate: string;
  parameters: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: WeatherParams = await request.json();
    const { longitude, latitude, startDate, endDate, parameters } = body;

    // Validate parameters
    if (!longitude || !latitude || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Format dates for NASA API (YYYYMMDD)
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toISOString().slice(0, 10).replace(/-/g, '');
    };

    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);

    // Default parameters if none provided
    const defaultParams = ['T2M', 'WS10M', 'PRECTOT', 'HUMIDITY'];
    const queryParams = parameters && parameters.length > 0 ? parameters : defaultParams;

    // Build NASA POWER API URL
    const baseUrl = 'https://power.larc.nasa.gov/api/temporal/daily/point';
    const params = new URLSearchParams({
      parameters: queryParams.join(','),
      community: 'RE',
      longitude: longitude.toString(),
      latitude: latitude.toString(),
      start: formattedStartDate,
      end: formattedEndDate,
      format: 'JSON'
    });

    const nasaUrl = `${baseUrl}?${params.toString()}`;

    // Fetch data from NASA POWER API
    const response = await fetch(nasaUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`NASA API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform the data for easier frontend consumption
    const transformedData = transformNasaData(data);

    return NextResponse.json({
      success: true,
      data: transformedData,
      metadata: {
        location: {
          longitude,
          latitude
        },
        dateRange: {
          start: startDate,
          end: endDate
        },
        parameters: queryParams,
        source: 'NASA POWER API'
      }
    });

  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch weather data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function transformNasaData(nasaData: any) {
  const properties = nasaData.properties;
  const parameter = properties.parameter;
  
  // Get all available dates
  const dates = Object.keys(parameter.T2M || parameter.WS10M || parameter.PRECTOT || parameter.HUMIDITY || {});
  
  // Transform data into arrays for easier chart consumption
  const transformed = {
    temperature: dates.map(date => ({
      date: formatDisplayDate(date),
      value: parameter.T2M?.[date] || null
    })).filter(item => item.value !== null),
    
    windSpeed: dates.map(date => ({
      date: formatDisplayDate(date),
      value: parameter.WS10M?.[date] || null
    })).filter(item => item.value !== null),
    
    precipitation: dates.map(date => ({
      date: formatDisplayDate(date),
      value: parameter.PRECTOT?.[date] || null
    })).filter(item => item.value !== null),
    
    humidity: dates.map(date => ({
      date: formatDisplayDate(date),
      value: parameter.HUMIDITY?.[date] || null
    })).filter(item => item.value !== null),
    
    // Raw parameter data for additional processing
    raw: parameter
  };

  return transformed;
}

function formatDisplayDate(dateString: string): string {
  // Convert YYYYMMDD to readable format
  const year = dateString.slice(0, 4);
  const month = dateString.slice(4, 6);
  const day = dateString.slice(6, 8);
  
  const date = new Date(`${year}-${month}-${day}`);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

// GET method for testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Example: /api/weather?lat=39&lon=29&start=2025-01-01&end=2025-01-02
  const latitude = parseFloat(searchParams.get('lat') || '39');
  const longitude = parseFloat(searchParams.get('lon') || '29');
  const startDate = searchParams.get('start') || '2025-01-01';
  const endDate = searchParams.get('end') || '2025-01-02';
  
  return POST(new NextRequest(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      latitude,
      longitude,
      startDate,
      endDate,
      parameters: ['T2M', 'WS10M', 'PRECTOT', 'HUMIDITY']
    })
  }));
}