import React from 'react';
import Button from 'react-bootstrap/lib/Button';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import Table from 'react-bootstrap/lib/Table';

class Excel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: this.props.initialData,
      sortby: null,
      descending: false,
      edit: null, // {row: 行番号，cell: 列番号}
      search: false,
    };

    this._log = [];
    this._preSearchData = null;

    this._sort = this._sort.bind(this);
    this._showEditor = this._showEditor.bind(this);
    this._save = this._save.bind(this);
    this._toggleSearch = this._toggleSearch.bind(this);
    this._search = this._search.bind(this);
  }

  _logSetState(newState) {
    this._log.push(JSON.parse(JSON.stringify(
      this._log.length === 0 ? this.state : newState
    )));
    this.setState(newState);
  }

  componentDidMount() {
    document.onkeydown = (e) => {
      if (e.altKey && e.shiftKey && e.keyCode === 82) {
        this._replay();
      }
    };
  }

  _replay() {
    if (this._log.length === 0) {
      console.warn('ステートが記録されていません');
      return;
    }
    let idx = -1;
    const interval = setInterval(() => {
      idx++;
      if (idx === this._log.length - 1) {
        clearInterval(interval);
      }
      this.setState(this._log[idx]);
    }, 1000);
  }

  _sort(e) {
    const column = e.target.cellIndex;
    const data = this.state.data.slice();
    const descending = this.state.sortby === column && !this.state.descending;
    data.sort((a, b) => {
      return descending
        ? (a[column] < b[column] ? 1 : -1)
        : (a[column] > b[column] ? 1 : -1);
    });
    this._logSetState({
      data: data,
      sortby: column,
      descending: descending,
    });
  }

  _showEditor(e) {
    this._logSetState({
      edit: {
        row: parseInt(e.target.dataset.row, 10),
        cell: e.target.cellIndex,
      }
    });
  }

  _save(e) {
    e.preventDefault();
    const input = e.target.firstChild;
    const data = this.state.data.slice();
    data[this.state.edit.row][this.state.edit.cell] = input.value;
    this._logSetState({
      edit: null,
      data: data,
    });
  }

  _toggleSearch() {
    if (this.state.search) {
      this._logSetState({
        data: this._preSearchData,
        search: false,
      });
      this._preSearchData = null;
    } else {
      this._preSearchData = this.state.data;
      this._logSetState({
        search: true,
      });
    }
  }

  _search(e) {
    const needle = e.target.value.toLowerCase();
    if (!needle) {
      this._logSetState({
        data: this._preSearchData,
      });
      return;
    }
    const idx = e.target.dataset.idx;
    const searchdata = this._preSearchData.filter((row) => {
      return row[idx].toString().toLowerCase().indexOf(needle) > -1;
    });
    this._logSetState({
      data: searchdata,
    });
  }

  _download(format, ev) {
    const contents = format === 'json'
      ? JSON.stringify(this.state.data)
      : this.state.data.reduce((result, row) => {
        return result
          + row.reduce((rowresult, cell, idx) => {
            return rowresult
              + '"'
              + cell.replace(/"/g, '""')
              + '"'
              + (idx < row.length - 1 ? ',' : '');
          }, '')
          + "\n";
      }, '');

    const URL = window.URL || window.webkitURL;
    const blob = new Blob([contents], { type: 'text/' + format });
    ev.target.href = URL.createObjectURL(blob);
    ev.target.download = 'data.' + format;
  }

  render() {
    return (
      <div>
        {this._renderToolbar()}
        {this._renderTable()}
      </div>
    );
  }

  _renderToolbar() {
    return (
      <ButtonToolbar className="toolbar">
        <ButtonGroup>
          <Button bsStyle="primary" onClick={this._toggleSearch}>検索</Button>
          <Button bsStyle="primary" onClick={this._download.bind(this, 'json')} href="data.json">JSONで保存</Button>
          <Button bsStyle="primary" onClick={this._download.bind(this, 'csv')} href="data.csv">CSVで保存</Button>
        </ButtonGroup>
      </ButtonToolbar>
    );
  }

  _renderSearch() {
    if (!this.state.search) {
      return null;
    }
    return (
      <tr onChange={this._search}>
        {this.props.headers.map((_ignore, idx) => {
          return (
            <td key={idx}>
              <input type="text" data-idx={idx} />
            </td>
          );
        })}
      </tr>
    );
  }

  _renderTable() {
    return (
      <Table bordered condensed hover>
        <thead onClick={this._sort}>
          <tr>
            {this.props.headers.map((title, idx) => {
              if (this.state.sortby === idx) {
                title += this.state.descending ? '\u2191' : '\u2193';
              }
              return <th key={idx}>{title}</th>;
            })}
          </tr>
        </thead>
        <tbody onDoubleClick={this._showEditor}>
          {this._renderSearch()}
          {this.state.data.map((row, rowidx) => {
            return (
              <tr key={rowidx}>
                {row.map((cell, idx) => {
                  let content = cell;
                  const edit = this.state.edit;
                  if (edit && edit.row === rowidx && edit.cell === idx) {
                    content = (
                      <form onSubmit={this._save}>
                        <input type="text" defaultValue={cell} />
                      </form>
                    );
                  }
                  return <td key={idx} data-row={rowidx}>{content}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </Table>
    );
  }
}

export default Excel
