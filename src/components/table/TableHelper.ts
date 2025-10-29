import { ColumnDefinition } from "./UTableModel";

export namespace TableHelper {

    export function buildColumns(data: any): ColumnDefinition[] {

        const columns: ColumnDefinition[] = [];

        if (data == null) {
            return columns;
        }

        let order = 1;
        let item = data;
        if (Array.isArray(data)) {
            item = data[0];
        }

        if (item == null) {
            return columns;
        }

        Object.keys(item).forEach(key => {
            var name = key;
            var title = asPascalCase(key);
            columns.push({
                type: 'basic',
                name: name,
                title: title,
                order: order++,
            });
        });

        return columns;
    }
}

function asPascalCase(key: string) {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, function (str) { return str.toUpperCase(); });
}
