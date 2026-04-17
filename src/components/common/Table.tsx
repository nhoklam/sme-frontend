import React from 'react';
import {
    Table as MuiTable,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    CircularProgress,
    Box,
    Typography,
} from '@mui/material';

const Table = ({
    columns,
    data,
    loading = false,
    pagination = true,
    page = 0,
    rowsPerPage = 10,
    totalRows = 0,
    onPageChange,
    onRowsPerPageChange,
    onRowClick,
    emptyMessage = 'Không có dữ liệu',
}) => {
    const handleChangePage = (event, newPage) => {
        if (onPageChange) onPageChange(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        if (onRowsPerPageChange) onRowsPerPageChange(parseInt(event.target.value, 10));
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography color="text.secondary">{emptyMessage}</Typography>
            </Box>
        );
    }

    return (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
                <MuiTable stickyHeader size="medium">
                    <TableHead>
                        <TableRow>
                            {columns.map((column, index) => (
                                <TableCell
                                    key={index}
                                    style={{ width: column.width }}
                                    align={column.align || 'left'}
                                >
                                    {column.headerName}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map((row, rowIndex) => (
                            <TableRow
                                key={row.id || rowIndex}
                                hover
                                onClick={() => onRowClick && onRowClick(row)}
                                sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                            >
                                {columns.map((column, colIndex) => (
                                    <TableCell
                                        key={colIndex}
                                        align={column.align || 'left'}
                                    >
                                        {column.render
                                            ? column.render(row[column.field], row)
                                            : row[column.field]}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </MuiTable>
            </TableContainer>

            {pagination && (
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={totalRows || data.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Số hàng mỗi trang:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
                />
            )}
        </Paper>
    );
};

export default Table;