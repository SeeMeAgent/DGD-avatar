import React, { useState, useEffect } from 'react';
import { ApiService, Language, Avatar } from '../../apiService';
import { useConfigurationStore } from '../../stores/configurationStore';
import { useNotifications } from '../../contexts/NotificationContext';
import { useStreamingContext } from '../../hooks/useStreamingContext';
import { useModal } from '../../contexts/useModal';
import { ProviderSelector } from '../ProviderSelector';
import AvatarSelector from '../AvatarSelector';
import './styles.css';

interface ConfigurationPanelProps {
  isJoined: boolean;
  startStreaming: () => Promise<void>;
  closeStreaming: () => Promise<void>;
  api: ApiService | null | undefined;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ api, isJoined, startStreaming, closeStreaming }) => {
  const { showError } = useNotifications();
  const { switchProvider } = useStreamingContext();
  const { openVoiceDialog, openJsonEditor } = useModal();

  // Configuration from store
  const {
    // OpenAPI settings
    openapiHost,
    setOpenapiHost,
    openapiCredential,
    setOpenapiCredential,
    authMethod,
    setAuthMethod,

    // Avatar settings
    avatarId,
    setAvatarId,
    voiceId,
    setVoiceId,
    knowledgeId,
    setKnowledgeId,

    // Session settings
    sessionDuration,
    setSessionDuration,
    modeType,
    setModeType,
    language,
    setLanguage,
    sceneMode,
    setSceneMode,
    e2eType,
    setE2eType,

    // Background and voice
    backgroundUrl,
    setBackgroundUrl,
    voiceUrl,
    setVoiceUrl,
    voiceParams,
    setVoiceParams,

    // Validation
    isFullyConfigured,
    validateConfiguration,
  } = useConfigurationStore();

  // Local state for API data and UI
  const [languages, setLanguages] = useState<Language[]>([]);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [backgroundUrlInput, setBackgroundUrlInput] = useState(backgroundUrl);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // --- 新增：控制侧边栏折叠的状态 ---
  const [isCollapsed, setIsCollapsed] = useState(false);

  // --- 新增：当开始直播(isJoined变true)时，自动折叠侧边栏 (可选) ---
  useEffect(() => {
    if (isJoined) {
        setIsCollapsed(true);
    } else {
        setIsCollapsed(false);
    }
  }, [isJoined]);

  // Load API data when API service is available
  useEffect(() => {
    if (!api) return;

    const loadData = async () => {
      try {
        const [languagesData, avatarsData] = await Promise.all([api.getLangList(), api.getAvatarList()]);
        setLanguages(languagesData);
        setAvatars(avatarsData);
      } catch (error) {
        showError('Failed to load configuration data', 'API Error');
      }
    };

    loadData();
  }, [api, showError]);

  // Validate configuration
  useEffect(() => {
    const validation = validateConfiguration();
    setValidationErrors(validation.errors);
  }, [validateConfiguration, openapiCredential, openapiHost, avatarId, voiceId, knowledgeId]);

  // Update background URL input when store changes
  useEffect(() => {
    setBackgroundUrlInput(backgroundUrl);
  }, [backgroundUrl]);

  // Handle start streaming
  const handleStartStreaming = async () => {
    if (!isFullyConfigured()) {
      showError('Please configure all required settings before starting');
      return;
    }

    if (validationErrors.length > 0) {
      showError(`Configuration errors: ${validationErrors.join(', ')}`);
      return;
    }

    setIsStarting(true);
    try {
      await startStreaming();
    } catch (error) {
      showError(`Failed to start streaming: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsStarting(false);
    }
  };

  // Handle background URL change
  const handleBackgroundUrlChange = (url: string) => {
    setBackgroundUrlInput(url);
    setBackgroundUrl(url);
  };

  // Handle voice params change
  const handleVoiceParamsChange = (params: Record<string, unknown>) => {
    setVoiceParams(params);
  };

  // Get selected avatar to check if background URL should be disabled
  const selectedAvatar = avatars.find((avatar) => avatar.avatar_id === avatarId);
  const isBackgroundUrlDisabled =
    selectedAvatar?.type === 2 && (selectedAvatar?.from === 3 || selectedAvatar?.from === 4);

  return (
    <>
      {/* --- 新增：切换显示/隐藏的悬浮按钮 --- */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
            position: 'absolute',
            left: isCollapsed ? '10px' : '360px', // 如果侧边栏展开，按钮在侧边栏旁边；如果折叠，靠左
            top: '20px',
            zIndex: 1000,
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'left 0.3s ease', // 增加平滑过渡
            color: '#333'
        }}
        title={isCollapsed ? "Show Configuration" : "Hide Configuration"}
      >
        {isCollapsed ? (
            // 展开图标 (chevron-right)
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
            </svg>
        ) : (
            // 收起图标 (chevron-left)
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
            </svg>
        )}
      </button>

      {/* 原有的左侧栏容器，增加样式控制 */}
      <div 
        className="left-side"
        style={{
            // 如果折叠，将宽度设为0并隐藏溢出，或者直接 display: none
            display: isCollapsed ? 'none' : 'flex', 
            // 如果你想让它有动画效果，可以使用下面的 width 方式代替 display: none (需要配合 styles.css 修改)
            // width: isCollapsed ? '0px' : '350px',
            // opacity: isCollapsed ? 0 : 1,
            // overflow: 'hidden',
            // transition: 'all 0.3s ease'
        }}
      >
        <h3>Streaming Avatar Demo</h3>

        <div className="scrollable-content">
          {/* CONNECTION Section */}
          <div className="config-group">
            <h4>CONNECTION</h4>

            {/* Provider Selection */}
            <div className="form-row">
              <label>Provider:</label>
              <ProviderSelector
                disabled={}
                onProviderChange={(providerType) => {
                  switchProvider(providerType);
                }}
              />
            </div>

            {/* Host */}
            <div className="form-row">
              <label>Host:</label>
              <input
                type="text"
                placeholder="Enter API host"
                value={}
                onChange={(e) => setOpenapiHost(e.target.value)}
                disabled={}
              />
            </div>

            {/* Authentication Method */}
            <div className="form-row">
              <label>Authentication:</label>
              <div className="auth-method-selector">
                <label className="auth-method-option">
                  <input
                    type="radio"
                    name="authMethod"
                    value="token"
                    checked={authMethod === 'token'}
                    onChange={(e) => setAuthMethod(e.target.value as 'token')}
                    disabled={}
                  />
                  <span>Token</span>
                </label>
                <label className="auth-method-option">
                  <input
                    type="radio"
                    name="authMethod"
                    value="apiKey"
                    checked={authMethod === 'apiKey'}
                    onChange={(e) => setAuthMethod(e.target.value as 'apiKey')}
                    disabled={}
                  />
                  <span>API Key</span>
                </label>
              </div>
            </div>

            {/* Credential Input */}
            <div className="form-row">
              <label>{authMethod === 'token' ? 'Token:' : 'API Key:'}</label>
              <input
                type="password"
                placeholder={authMethod === 'token' ? 'Enter API token' : 'Enter API key'}
                value={}
                onChange={(e) => setOpenapiCredential(e.target.value)}
                disabled={}
              />
            </div>
          </div>

          {/* AVATAR & MEDIA Section */}
          <div className="config-group">
            <h4>AVATAR & MEDIA</h4>

            {/* Avatar Selection */}
            <div className="form-row">
              <AvatarSelector
                api={}
                avatarId={}
                setAvatarId={}
                avatars={}
                setAvatars={}
                setAvatarVideoUrl={() => {}} 
                disabled={}
              />
            </div>

            {/* Background URL */}
            <div className="form-row">
              <label>
                Background URL:
                {isBackgroundUrlDisabled && (
                  <span style={{ color: '#666', fontSize: '12px', marginLeft: '8px' }}>
                    (Not available for this avatar type)
                  </span>
                )}
              </label>
              <input
                type="url"
                placeholder="Enter background image/video URL"
                value={}
                onChange={(e) => handleBackgroundUrlChange(e.target.value)}
                disabled={isBackgroundUrlDisabled || isJoined}
              />
            </div>

            {/* Language */}
            <div className="form-row">
              <label>Language:</label>
              <select value={} onChange={(e) => setLanguage(e.target.value)}>
                <option value="">Select Language</option>
                {languages.map((lang) => (
                  <option key={lang.lang_code} value={lang.lang_code}>
                    {lang.lang_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Voice Selection */}
            <div className="form-row">
              <label>Voice:</label>
              <div className="input-with-buttons">
                <input
                  type="text"
                  value={}
                  onChange={(e) => setVoiceId(e.target.value)}
                  placeholder="Enter voice ID or select from list"
                  className="voice-input"
                />
                <button
                  type="button"
                  onClick={}
                  disabled={!api}
                  className="btn btn-secondary btn-sm"
                  title="Select voice from list"
                >
                  <span className="material-icons">list</span>
                  Select
                </button>
              </div>
            </div>

            {/* Voice URL */}
            <div className="form-row">
              <label>Voice URL:</label>
              <input
                type="url"
                placeholder="Enter voice URL"
                value={}
                onChange={(e) => setVoiceUrl(e.target.value)}
              />
            </div>

            {/* Voice Parameters */}
            <div className="form-row">
              <label>Voice Parameters (JSON):</label>
              <div className="input-with-buttons">
                <input type="text" value={JSON.stringify(voiceParams)} readOnly placeholder="{}" />
                <button
                  type="button"
                  onClick={() => openJsonEditor(voiceParams, handleVoiceParamsChange, 'Voice Parameters')}
                  className="edit-json-button"
                  title="Edit JSON parameters"
                >
                  ✏️
                </button>
              </div>
            </div>
          </div>

          {/* SESSION Section */}
          <div className="config-group">
            <h4>SESSION</h4>

            {/* Session Duration */}
            <div className="form-row">
              <label>Session Duration (minutes):</label>
              <input
                type="number"
                placeholder="Enter duration"
                value={}
                onChange={(e) => setSessionDuration(Number(e.target.value))}
                min="1"
              />
            </div>

            {/* ModeType */}
            <div className="form-row">
              <label>ModeType:</label>
              <select value={} onChange={(e) => setModeType(Number(e.target.value))}>
                <option value={}>Repeat</option>
                <option value={}>Dialogue</option>
              </select>
            </div>

            {/* Scene Mode */}
            <div className="form-row">
              <label>Scene Mode:</label>
              <select
                value={}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const value = e.target.value;
                  setSceneMode(value === 'fast_dialogue' ? 'fast_dialogue' : value === 'meeting' ? 'meeting' : '');
                }}
              >
                <option value="">Default</option>
                <option value="fast_dialogue">Fast Dialogue</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>

            {/* E2E Type */}
            {sceneMode === 'fast_dialogue' && (
              <div className="form-row">
                <label>E2E Type:</label>
                <select
                  value={}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const value = e.target.value;
                    setE2eType(value === 'openai' ? 'openai' : '');
                  }}
                >
                  <option value="">Default</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>
            )}

            {/* Knowledge ID */}
            <div className="form-row">
              <label>Knowledge ID:</label>
              <input
                type="text"
                placeholder="Enter knowledge ID"
                value={}
                onChange={(e) => setKnowledgeId(e.target.value)}
              />
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div
              className="config-group"
              style={{
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                border: '1px solid #fecaca',
                marginTop: '16px',
              }}
            >
              <h4
                style={{
                  color: '#dc2626',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                ⚠️ Configuration Errors:
              </h4>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '20px',
                  listStyle: 'none',
                }}
              >
                {validationErrors.map((error, index) => (
                  <li
                    key={}
                    style={{
                      marginBottom: '8px',
                      padding: '8px 12px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      borderRadius: '6px',
                      borderLeft: '3px solid #dc2626',
                      color: '#991b1b',
                      fontSize: '14px',
                    }}
                  >
                    • {}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Fixed Action Buttons */}
        <div className="fixed-button-area">
          <div className="buttons">
            {!isJoined ? (
              <button
                onClick={}
                disabled={!isFullyConfigured() || validationErrors.length > 0 || isStarting}
                className="button-on"
              >
                {isStarting ? 'Starting...' : 'Start Streaming'}
              </button>
            ) : (
              <button onClick={} className="button-off">
                Stop Streaming
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfigurationPanel;
