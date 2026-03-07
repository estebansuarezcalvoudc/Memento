import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import ModelConfigSection from '../../../../src/components/settings/sections/ui/ModelConfigSection'

const AVAILABLE_MODELS = [
  { id: 'llama3.2:latest', provider: 'Ollama' },
  { id: 'gpt-4o', provider: 'OpenAI' },
]

const CURRENT_MODEL = {
  provider: 'Ollama',
  modelName: 'llama3.2:latest',
  temperature: 0.7,
  maxTokens: 2000,
}

function renderSection(
  overrides: Partial<React.ComponentProps<typeof ModelConfigSection>> = {},
) {
  const onSave = vi.fn()
  render(
    <ModelConfigSection
      title="Test Model"
      availableModels={AVAILABLE_MODELS}
      currentModel={CURRENT_MODEL}
      isLoading={false}
      isPending={false}
      isError={false}
      onSave={onSave}
      {...overrides}
    />,
  )
  return { onSave }
}

describe('ModelConfigSection', () => {
  it('shows loading state when isLoading is true', () => {
    renderSection({ isLoading: true })
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows the configured model in the select', () => {
    renderSection()
    expect(screen.getByLabelText('Model')).toHaveValue('llama3.2:latest')
  })

  it('shows available models as select options', () => {
    renderSection()
    expect(
      screen.getByRole('option', { name: /llama3\.2:latest/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /gpt-4o/ })).toBeInTheDocument()
  })

  it('shows the configured temperature value', () => {
    renderSection()
    expect(screen.getByLabelText('Temperature')).toHaveValue(0.7)
  })

  it('shows the configured max tokens value', () => {
    renderSection()
    expect(screen.getByLabelText('Max tokens')).toHaveValue(2000)
  })

  it('Save and Cancel are disabled while no edits have been made', () => {
    renderSection()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })

  it('changing the model enables Save and Cancel', async () => {
    const user = userEvent.setup()
    renderSection()
    await user.selectOptions(screen.getByLabelText('Model'), 'gpt-4o')
    expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).not.toBeDisabled()
  })

  it('changing temperature enables Save', async () => {
    const user = userEvent.setup()
    renderSection()
    await user.clear(screen.getByLabelText('Temperature'))
    await user.type(screen.getByLabelText('Temperature'), '1.2')
    expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
  })

  it('Cancel resets the model to the original value', async () => {
    const user = userEvent.setup()
    renderSection()
    await user.selectOptions(screen.getByLabelText('Model'), 'gpt-4o')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByLabelText('Model')).toHaveValue('llama3.2:latest')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('calls onSave with the updated config when Save is clicked', async () => {
    const user = userEvent.setup()
    const { onSave } = renderSection()
    await user.selectOptions(screen.getByLabelText('Model'), 'gpt-4o')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith({
      provider: 'OpenAI',
      modelName: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 2000,
    })
  })

  it('disables Save and Cancel after saving', async () => {
    const user = userEvent.setup()
    renderSection()
    await user.selectOptions(screen.getByLabelText('Model'), 'gpt-4o')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled(),
    )
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })

  it('shows an error message when isError is true', () => {
    renderSection({ isError: true })
    expect(
      screen.getByText('Failed to save. Please try again.'),
    ).toBeInTheDocument()
  })

  it('Save is disabled when no model is selected', async () => {
    const user = userEvent.setup()
    renderSection({
      currentModel: {
        provider: '',
        modelName: '',
        temperature: 0.7,
        maxTokens: 2000,
      },
    })
    // Trigger a draft without selecting a model
    await user.clear(screen.getByLabelText('Temperature'))
    await user.type(screen.getByLabelText('Temperature'), '1.0')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })
})
