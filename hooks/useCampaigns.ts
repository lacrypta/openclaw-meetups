"use client";

import { useState, useEffect, useCallback } from 'react';
import { getToken } from '../lib/auth';
import type { EmailJob, EmailSend, EmailJobSegment } from '../lib/types';

export function useCampaigns(eventId: string) {
  const [campaigns, setCampaigns] = useState<EmailJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    const token = getToken();
    if (!token || !eventId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/campaigns?event_id=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch campaigns');

      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const createCampaign = async (params: {
    event_id: string;
    segment: EmailJobSegment;
    template_id: string;
    subject: string;
    integration_id: string;
  }) => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch('/api/campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const { error } = await response.json();
      throw new Error(error || 'Failed to create campaign');
    }

    const data = await response.json();
    await fetchCampaigns();
    return data.campaign as EmailJob;
  };

  const cancelCampaign = async (campaignId: string) => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`/api/campaigns/${campaignId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'cancelled' }),
    });

    if (!response.ok) {
      const { error } = await response.json();
      throw new Error(error || 'Failed to cancel campaign');
    }

    await fetchCampaigns();
  };

  const sendCampaign = async (campaignId: string) => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`/api/campaigns/${campaignId}/send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const { error } = await response.json();
      throw new Error(error || 'Failed to send campaign');
    }

    await fetchCampaigns();
    return (await response.json()).campaign as EmailJob;
  };

  const retryCampaign = async (campaignId: string) => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`/api/campaigns/${campaignId}/retry`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const { error } = await response.json();
      throw new Error(error || 'Failed to retry campaign');
    }

    await fetchCampaigns();
  };

  return { campaigns, loading, error, refetch: fetchCampaigns, createCampaign, cancelCampaign, sendCampaign, retryCampaign };
}

export function useCampaignDetail(campaignId: string | null) {
  const [campaign, setCampaign] = useState<EmailJob | null>(null);
  const [sends, setSends] = useState<EmailSend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    const token = getToken();
    if (!token || !campaignId) {
      setCampaign(null);
      setSends([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch campaign detail');

      const data = await response.json();
      setCampaign(data.campaign || null);
      setSends(data.sends || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch campaign detail');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { campaign, sends, loading, error, refetch: fetchDetail };
}
