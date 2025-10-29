import axios from 'axios';

export interface RadioKingTrackMetadata {
  id: number;
  artist: string;
  title: string;
  album: string;
  started_at: string;
  end_at: string;
  next_track: string;
  duration: number;
  is_live: boolean;
  cover: string;
  default_cover: boolean;
  forced_title: boolean;
  buy_link: string | null;
}

export interface RadioKingMetadataResponse {
  success: boolean;
  data: RadioKingTrackMetadata | null;
  error?: string;
}

export class RadioKingService {
  private static readonly BASE_URL = 'https://api.radioking.io/widget/radio';
  private static readonly RADIO_NAME = 'enishradio';
  
  /**
   * Fetch current track metadata from RadioKing API
   */
  static async getCurrentTrack(): Promise<RadioKingMetadataResponse> {
    try {
      const response = await axios.get(`${this.BASE_URL}/${this.RADIO_NAME}/track/current?format=json`, {
        timeout: 5000, // 5 second timeout
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'EnishRadioPro/1.0.0'
        }
      });
      
      if (response.data && response.data.id) {
        return {
          success: true,
          data: response.data as RadioKingTrackMetadata
        };
      } else {
        return {
          success: false,
          data: null,
          error: 'No track data available'
        };
      }
    } catch (error) {
      console.error('Error fetching RadioKing metadata:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch metadata'
      };
    }
  }
  
  /**
   * Get current track as formatted text
   */
  static async getCurrentTrackText(): Promise<string> {
    try {
      const response = await axios.get(`${this.BASE_URL}/${this.RADIO_NAME}/track/current?format=text`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'EnishRadioPro/1.0.0'
        }
      });
      
      return response.data || 'Enish Radio - Live Stream';
    } catch (error) {
      console.error('Error fetching RadioKing text metadata:', error);
      return 'Enish Radio - Live Stream';
    }
  }
  
  /**
   * Convert RadioKing metadata to our app format
   */
  static convertToAppFormat(radioKingData: RadioKingTrackMetadata | null) {
    if (!radioKingData) {
      return {
        title: 'Enish Radio Live',
        artist: '24/7 Music Stream',
        album: 'Live Stream',
        artwork: '',
        duration: 0
      };
    }
    
    return {
      title: radioKingData.title || 'Enish Radio Live',
      artist: radioKingData.artist || '24/7 Music Stream',
      album: radioKingData.album || 'Live Stream',
      artwork: radioKingData.cover || '',
      duration: radioKingData.duration || 0,
      isLive: radioKingData.is_live,
      startTime: radioKingData.started_at,
      endTime: radioKingData.end_at
    };
  }
}

export default RadioKingService;
