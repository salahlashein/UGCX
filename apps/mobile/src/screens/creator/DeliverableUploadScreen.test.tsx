import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { DeliverableUploadScreen } from './DeliverableUploadScreen';
import * as storageModule from '../../hooks/api/useStorage';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string, options?: any) => {
      let str = fallback ?? key;
      if (options?.count !== undefined) {
        str = str.replace('{{count}}', String(options.count));
      }
      if (options?.percent !== undefined) {
        str = str.replace('{{percent}}', String(options.percent));
      }
      return str;
    },
  }),
}));

let mockCollabData: any = {
  id: 'collab-1',
  status: 'revision_requested',
  brand: { companyName: 'Glow Lab' },
  campaign: { durationSeconds: 60 },
};

let mockDeliverablesData: any = [
  {
    id: 'deliv-1',
    version: 1,
    status: 'revision_requested',
    feedback: [{ id: 'f-1', body: 'Show the pump texture closer, otherwise great.' }],
  },
];

jest.mock('../../hooks/api/useCollaborations', () => ({
  useCollaboration: () => ({
    data: mockCollabData,
    isLoading: false,
  }),
}));

const mockRegisterDeliverable = jest.fn();
const mockRequestUploadUrl = jest.fn();
jest.mock('../../hooks/api/useDeliverables', () => ({
  useCollaborationDeliverables: () => ({
    data: mockDeliverablesData,
    isLoading: false,
  }),
  useRegisterDeliverable: () => ({
    mutateAsync: mockRegisterDeliverable,
    isPending: false,
  }),
  useRequestUploadUrl: () => ({
    mutateAsync: mockRequestUploadUrl,
  }),
}));

jest.mock('../../hooks/api/useStorage', () => ({
  uploadFileToPresignedUrl: jest.fn(),
}));

describe('DeliverableUploadScreen', () => {
  const mockRoute = {
    params: { collaborationId: 'collab-1' },
    key: 'DeliverableUpload-1',
    name: 'DeliverableUpload' as const,
  };
  const mockNavigation: any = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dynamic revision banner with exact feedback body text', async () => {
    const { findByText } = await render(
      <DeliverableUploadScreen route={mockRoute as any} navigation={mockNavigation} />,
    );

    expect(await findByText('Revision 1 requested')).toBeTruthy();
    expect(await findByText('"Show the pump texture closer, otherwise great."')).toBeTruthy();
  });

  it('a failed upload renders the danger banner with the failure percent', async () => {
    mockRequestUploadUrl.mockResolvedValue({
      uploadUrl: 'https://s3.example.com/upload',
      fileUrl: 'https://s3.example.com/file.mp4',
    });

    jest
      .spyOn(storageModule, 'uploadFileToPresignedUrl')
      .mockImplementation(async (_uri, _url, _type, onProgress) => {
        onProgress?.(42);
        throw new Error('Network request failed');
      });

    const { findByText } = await render(
      <DeliverableUploadScreen
        route={mockRoute as any}
        navigation={mockNavigation}
        initialVideoUri="file:///glowlab-review-v2.mp4"
        initialAllChecked={true}
      />,
    );

    const submitButton = await findByText('Submit for review');
    await act(async () => {
      fireEvent.press(submitButton);
    });

    expect(await findByText('Failed at 42%')).toBeTruthy();
    expect(await findByText('Retry upload')).toBeTruthy();
  });

  it('the retry action restarts the upload from zero and clears the error', async () => {
    mockRequestUploadUrl.mockResolvedValue({
      uploadUrl: 'https://s3.example.com/upload',
      fileUrl: 'https://s3.example.com/file.mp4',
    });

    // 1st time fails at 42%, 2nd time succeeds
    let attempt = 0;
    jest
      .spyOn(storageModule, 'uploadFileToPresignedUrl')
      .mockImplementation(async (_uri, _url, _type, onProgress) => {
        attempt++;
        if (attempt === 1) {
          onProgress?.(42);
          throw new Error('Connection lost');
        } else {
          onProgress?.(100);
        }
      });

    const { findByText, queryByText } = await render(
      <DeliverableUploadScreen
        route={mockRoute as any}
        navigation={mockNavigation}
        initialVideoUri="file:///glowlab-review-v2.mp4"
        initialAllChecked={true}
      />,
    );

    // First attempt -> failure at 42%
    const submitBtn = await findByText('Submit for review');
    await act(async () => {
      fireEvent.press(submitBtn);
    });
    expect(await findByText('Failed at 42%')).toBeTruthy();

    // Second attempt via Retry upload action -> clears error and completes
    const retryBtn = await findByText('Retry upload');
    await act(async () => {
      fireEvent.press(retryBtn);
    });

    expect(queryByText('Failed at 42%')).toBeNull();
    expect(mockRegisterDeliverable).toHaveBeenCalled();
  });
});
