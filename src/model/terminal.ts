import { Terminal } from '../types'
import { Neovim } from '@chemzqm/neovim'
const isVim = process.env.VIM_NODE_RPC == '1'
const logger = require('../util/logger')('model-terminal')

export default class TerminalModel implements Terminal {
  public bufnr: number
  private pid = 0

  constructor(private cmd: string,
    private args: string[],
    private nvim: Neovim,
    private _name?: string) {
  }

  public async start(cwd?: string, env?: { [key: string]: string | null }): Promise<void> {
    let { nvim } = this
    let cmd = [this.cmd, ...this.args]
    let [bufnr, pid] = await nvim.call('coc#terminal#start', [cmd, cwd, env || {}])
    this.bufnr = bufnr
    this.pid = pid
  }

  public get name(): string {
    return this._name || this.cmd
  }

  public get processId(): number {
    return this.pid
  }

  public sendText(text: string, addNewLine = true): void {
    if (!this.bufnr) return
    this.nvim.call('coc#terminal#send', [this.bufnr, text, addNewLine], true)
  }

  public async show(preserveFocus?: boolean): Promise<void> {
    let { bufnr, nvim } = this
    if (!bufnr) return
    let winnr = await nvim.call('bufwinnr', bufnr)
    nvim.pauseNotification()
    if (winnr == -1) {
      nvim.command(`below ${bufnr}sb`, true)
      nvim.command('resize 8', true)
      nvim.call('coc#util#do_autocmd', ['CocTerminalOpen'], true)
    } else {
      nvim.command(`${winnr}wincmd w`, true)
    }
    nvim.command('normal! G', true)
    if (preserveFocus) {
      nvim.command('wincmd p', true)
    }
    await nvim.resumeNotification()

  }

  public async hide(): Promise<void> {
    let { bufnr, nvim } = this
    if (!bufnr) return
    let winnr = await nvim.call('bufwinnr', bufnr)
    if (winnr == -1) return
    await nvim.command(`${winnr}close!`)
  }

  public dispose(): void {
    let { bufnr, nvim } = this
    if (!bufnr) return
    nvim.call('coc#terminal#close', [bufnr], true)
  }
}
