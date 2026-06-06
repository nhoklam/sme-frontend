import { districtCentroids } from '../data/districtCentroids';

export const useShippingCoordinates = (districtCode: string | undefined): { lat: number; lng: number } | null => {
    if (!districtCode) return null;
    return districtCentroids[districtCode] || null;
};
